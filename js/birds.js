const p5Polyfill = {
  PI: Math.PI,
  HALF_PI: Math.PI / 2,
  random: (a, b) => {
    if (a !== undefined && b !== undefined) {
    return Math.floor(Math.random() * b) + a;
    } else {
    // Assume a is an array.
    const i = Math.floor(Math.random() * a.length);
    return a[i];
    }
  },
  fill: (c) => context.fillStyle = c,
  stroke: (c) => context.strokeStyle = c,
  noFill: () => context.fillStyle = 'transparent',
  noStroke: () => context.strokeStyle = 'transparent',
  push: () => context.save(),
  pop: () => context.restore(),
  translate: (x,y) => context.translate(x,y),
  scale: (x,y) => context.scale(x,y),
  rotate: (a) => context.rotate(a),
  rect: (x,y,w,h) => {
    context.fillRect(x, y, w, h);
    context.strokeRect(x, y, w, h);
  },
  circle: (x,y,d) => {
    context.beginPath();
    context.arc(x, y, d/2, 0, Math.PI * 2, false);
    context.fill();
    context.stroke();
  },
  arc: (x, y, w, h, start, stop, slice=false) => {
    context.beginPath();
    if (!slice) {
    context.moveTo(x, y);
    }

    context.arc(x, y, w/2, start, stop);

    context.closePath();
    context.fill();
    context.stroke();
  }
}

function birds(p) {
  const colors = [
    '#84B4F9', '#1231B5', //blues
    '#BFE9DC', '#39948E',  //greens
    '#FAC832', //yellow
    '#FECBCA', '#F83735', //reds
    //'black',  //grey
  ];
  const shapes = [
    'arc-1', 'arc-2', 'arc-3', 'arc-4',
    'skip','skip',
  ];

  // Motion: each shape grows into its cell, staggered by a pattern. Each page
  // load picks one at random, unless the art's container sets data-motion.
  const MOTIONS = ['wave', 'ripple', 'scatter', 'spin'];
  const DURATION = 520;
  const SPREAD = 650;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document
    .querySelectorAll('#birbs > canvas, [data-birbs] > canvas')
    .forEach(setup);

  function setup(canvas) {
    const root = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    const art = { size: 0, current: null, previous: null, start: 0, raf: 0 };
    root.dataset.motion ||= p.random(MOTIONS);

    const regenerate = () => {
      art.previous = art.current;
      art.current = compose(root.dataset.motion);
      play();
    };

    const play = () => {
      cancelAnimationFrame(art.raf);
      if (reduceMotion.matches) {
        art.previous = null;
        render(Infinity);
        return;
      }
      art.start = performance.now();
      const tick = (now) => {
        const t = now - art.start;
        render(t);
        if (t < SPREAD + DURATION * 1.25) {
          art.raf = requestAnimationFrame(tick);
        } else {
          art.previous = null;
        }
      };
      art.raf = requestAnimationFrame(tick);
    };

    const render = (t) => {
      context = ctx;
      p.noStroke();
      p.fill('white');
      p.rect(0, 0, art.size, art.size);

      // Old shapes shrink away just ahead of the new ones growing in.
      if (art.previous) {
        drawOps(art.previous, art.size, (op) => 1 - ease(progress(t, op.delay, DURATION * 0.6)), false);
      }
      drawOps(art.current, art.size, (op) => easeBack(progress(t, op.delay + DURATION * 0.25, DURATION)), true);
    };

    canvas.addEventListener('click', regenerate);
    canvas.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        regenerate();
      }
    });
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'button');
    canvas.setAttribute('aria-label', 'Regenerate the artwork');

    const helpButton = root.querySelector('.birbs-legend button');
    const note = root.querySelector('.birbs-note');
    if (helpButton && note) {
      helpButton.addEventListener('click', () => {
        const isExpanded = helpButton.getAttribute('aria-expanded') === 'true';
        helpButton.setAttribute('aria-expanded', String(!isExpanded));
        note.hidden = isExpanded;
      });
    }

    const resize = () => {
      const size = canvas.getBoundingClientRect().width;
      const pixelSize = Math.round(size * window.devicePixelRatio);
      if (!size || (canvas.width === pixelSize && art.size === size)) return;

      canvas.width = pixelSize;
      canvas.height = pixelSize;
      ctx.setTransform(pixelSize / size, 0, 0, pixelSize / size, 0, 0);
      art.size = size;

      if (art.current) {
        render(Infinity);
      } else {
        regenerate();
      }
    };

    resize();
    new ResizeObserver(resize).observe(canvas);
    window.addEventListener('resize', resize);
  }

  // Builds the composition as a list of cell ops so it can be animated.
  function compose(motion) {
    const n = Math.floor(p.random(5, 7));
    const rows = n;
    const cols = n;
    const grid = Array.from({length: rows}, () => Array(cols).fill(null));
    const set = (row, col, shape, color) => {
      if (row >= 0 && col >= 0 && row < rows && col < cols) {
        grid[row][col] = shape ? {shape, color} : null;
      }
    };
    const extras = [];
    const finish = () => toOps(grid, extras, n, motion);

    for (let j = 0; j < cols; j++) {
      for (let i = 0; i < rows; i++) {
        const color = p.random(colors);
        const shape = p.random(shapes);
        set(i, j, shape === 'skip' ? null : shape, color);
      }
    }

    // Now force-pick some shapes.

    // Flower:
    // arc-3 arc-4
    // arc-2 arc-1
    const availableRows = Array.from({length: rows-1}, (_, i) => i);
    const availableCols = Array.from({length: cols-1}, (_, i) => i);

    let row = p.random(availableRows);
    let col = p.random(availableCols);
    availableRows.splice(availableRows.indexOf(row), 1);
    availableRows.splice(availableRows.indexOf(row + 1), 1);
    availableCols.splice(availableCols.indexOf(col), 1);
    availableCols.splice(availableCols.indexOf(col + 1), 1);

    set(row, col, 'arc-3', 'black');
    set(row, col + 1, 'arc-4', 'black');
    set(row + 1, col, 'arc-2', 'black');
    set(row + 1, col + 1, 'arc-1', 'black');

    // Birb.
    //    arc-3   empty
    //    arc-2  arc-1.
    row = p.random(availableRows);
    col = p.random(availableCols);
    if (row === undefined || col === undefined) {
      console.log('out of cells for birb');
      return finish();
    }
    availableRows.splice(availableRows.indexOf(row), 1);
    availableRows.splice(availableRows.indexOf(row + 1), 1);
    availableCols.splice(availableCols.indexOf(col), 1);
    availableCols.splice(availableCols.indexOf(col + 1), 1);

    set(row, col, 'arc-3', 'black');
    set(row, col + 1, null);
    set(row + 1, col, 'arc-2', 'black');
    set(row + 1, col + 1, 'arc-1', 'black');

    // Grass:
    // leaf-1 leaf-2
    //      ||
    row = p.random(availableRows);
    col = p.random(availableCols);
    if (row === undefined || col === undefined) {
      console.log('out of cells for grass');
      return finish();
    }
    set(row, col, 'leaf-1', 'black');
    set(row, col + 1, 'leaf-2', 'black');
    set(row + 1, col, null);
    set(row + 1, col + 1, null);
    extras.push({shape: 'stem', color: 'black', row: row + 1, col: col + 1});

    return finish();
  }

  function toOps(grid, extras, n, motion) {
    const ops = [];
    grid.forEach((cells, row) => cells.forEach((cell, col) => {
      if (cell) ops.push({...cell, row, col});
    }));
    ops.push(...extras);

    for (const op of ops) {
      const x = (op.col + 0.5) / n;
      const y = (op.row + 0.5) / n;
      op.delay = SPREAD * delayFor(motion, x, y);
    }
    return {n, ops, motion};
  }

  function delayFor(motion, x, y) {
    switch (motion) {
      case 'scatter':
        return Math.random();
      case 'ripple':
        return Math.min(1, Math.hypot(x - 0.5, y - 0.5) / 0.7);
      default:
        return (x + y) / 2;
    }
  }

  function drawOps(art, size, scaleFor, isEntering) {
    const cellSize = Math.floor(size / art.n);
    for (const op of art.ops) {
      const s = scaleFor(op);
      if (s <= 0) continue;

      p.fill(op.color);
      p.push();
      if (op.shape === 'stem') {
        // The stem grows down from the leaves.
        p.translate(op.col * cellSize, op.row * cellSize);
        p.scale(1, s);
        p.rect(-2, 0, 4, cellSize);
      } else {
        const d = cellSize / 2;
        p.translate(op.col * cellSize + d, op.row * cellSize + d);
        if (art.motion === 'spin' && isEntering) {
          p.rotate((1 - Math.min(s, 1)) * -p.HALF_PI);
        }
        p.scale(s, s);
        p.translate(-d, -d);
        drawShape(op.shape, cellSize);
      }
      p.pop();
    }
  }

  function progress(t, delay, duration) {
    return Math.max(0, Math.min(1, (t - delay) / duration));
  }

  function ease(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Overshoots a touch, so shapes land with a little bounce.
  function easeBack(t) {
    const c = 1.4;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  }

  function drawShape(shape, cellSize, slice=false) {
    const d = cellSize/2;

    switch (shape) {
      case 'circle':
        p.circle(d, d, cellSize);
        break;
      case 'square':
        p.rect(0, 0, cellSize, cellSize);
        break;
      case 'arc-1':
        p.arc(0, 0, cellSize*2, cellSize*2, 0, p.HALF_PI, slice);
        break;
      case 'arc-2':
        p.translate(cellSize, 0);
        p.scale(-1, 1);
        p.arc(0, 0, cellSize*2, cellSize*2, 0, p.HALF_PI, slice);
        break;
      case 'arc-3':
        p.translate(0, cellSize);
        p.scale(1, -1);
        p.arc(0, 0, cellSize*2, cellSize*2, 0, p.HALF_PI, slice);
        break;
      case 'arc-4':
        p.translate(cellSize, cellSize);
        p.scale(-1, -1);
        p.arc(0, 0, cellSize*2, cellSize*2, 0, p.HALF_PI, slice);
        break;
      case 'skip':
        break;
      case 'leaf-1':
        drawShape('arc-2', cellSize, true);
        drawShape('arc-4', cellSize, true);
        break;
      case 'leaf-2':
        drawShape('arc-1', cellSize, true);
        drawShape('arc-4', cellSize, true);
        break;
      default:
        break;
    }
  }
}

// This simulates how p5.js works because that's where I wrote the code
// first and I like p5.js but not on this page.
let context;
window.p = p5Polyfill;
birds(p);
