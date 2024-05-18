+++
date = "2019-06-20"
title = "file uploads using s3 presigned urls, golang, and js"
slug = "s3-presigned"
tags = ["code", "go", "golang", "s3 presigned"]
categories = ["code"]
+++

## file uploads using s3 presigned urls, golang, and js

The Go using [echo](https://github.com/labstack/echo):

```go
func PresignedS3Url() echo.HandlerFunc {
	fn := func(c echo.Context) error {
		sess := session.New(&aws.Config{
			Region: aws.String("your_aws_region")},
		)

		svc := s3.New(sess)

		fileType := c.FormValue("filetype")

		path := fmt.Sprintf("%s/%s/%s", "your_video_folder", "your_video_output_codec_folder", uuid.NewV4())

		req, _ := svc.PutObjectRequest(&s3.PutObjectInput{
			Bucket:      aws.String("your_bucket"),
			Key:         aws.String(path),
			ContentType: aws.String(fileType),
			ACL:         aws.String("public-read"),
		})
		str, err := req.Presign(30 * time.Minute)

		r := new(UrlResponse)
		r.Url = str
		b, err := json.Marshal(r)
		if err != nil {
			c.String(http.StatusInternalServerError, "Error marshal-ing json response.")
			return err
		}

		return c.JSONBlob(200, b)
	}

	return fn
}
```

The JS:

```javascript
onDrop = files => {
  files.forEach(file => {
    // setup request params
    const fileType = file.type;

    if (!fileType.includes("video")) {
      // TODO: handle non-videos
      return;
    }

    request
      .post('/presigned_s3_url') // get presigned url from go backend
      .field("filetype", fileType) // send filetype instead of sending file and letter backend figure out filetype
      .then(response => {
        const s3_signed_url = JSON.parse(response.text).url;

        // misc code related to progress bar rendering
        const fileId = uuid();
        const newState = Object.assign({}, this.state.hlsProgressMap);
        newState[fileId] = {
          name: file.name,
          progress: 0
        };
        this.setState({ hlsProgressMap: newState });

        const that = this;

        // vanilla js file upload using presigned url
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", s3_signed_url, true);

        // the line below is pretty useful and necessary
        xhr.setRequestHeader("x-amz-acl", "public-read"); // <- this caused me a bit of grief to figure out
        // again, the line above is really really important

        xhr.setRequestHeader("Content-Type", fileType);

        // more misc. progress bar stuff
        xhr.upload.onprogress = e => {
          const percentComplete = Math.ceil((e.loaded / e.total) * 100);

          const newNewState = Object.assign({}, that.state.hlsProgressMap);
          newNewState[fileId].percent = percentComplete;
          that.setState({ hlsProgressMap: newNewState });
        };
        xhr.send(file);
      });
  });
};
```
