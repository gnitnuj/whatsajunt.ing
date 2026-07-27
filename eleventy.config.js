export default function (eleventyConfig) {
  eleventyConfig.ignores.add("README.md");

  eleventyConfig.addPassthroughCopy("*.html");
  eleventyConfig.addPassthroughCopy("posts");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("icons");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("manifest.json");

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
    },
    templateFormats: ["md", "njk"],
    htmlTemplateEngine: "njk",
  };
}
