import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3 } from "aws-sdk";
import { fetchProductByEmail } from "./db/handler.js";
import { sendResponse } from "./utils/utils.js";

import axios from "axios";
import { DocumentClient } from "aws-sdk/clients/dynamodb.js";

const s3 = new S3({
  signatureVersion: "v4",
});
const bucketName = "awsbucketpresigned";

export const putImage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const filename: string = event.queryStringParameters?.keyname;
  const item: DocumentClient.AttributeMap = await fetchProductByEmail(event.requestContext.authorizer.claims.email);
  const folderName: string = item.userID;
  if (!filename) {
    return sendResponse(400, { message: "Filename is empty" });
  }
  const signedUrl: string = s3.getSignedUrl("putObject", {
    Bucket: bucketName,
    Key: folderName + "/" + filename,
    Expires: 3600,
    ContentType: "image/jpeg",
  });
  if (!event.body) {
    return sendResponse(400, { message: "Add file for uploading" });
  }
  const response = await axios({
    method: "put",
    url: signedUrl,
    data: event.body,
    headers: {
      "Content-type": "multipart/form-data",
    },
  });

  return sendResponse(200, {
    status: "Success",
    message: "Uploaded to the S3",
  });
};

export const deleteImage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const filename: string = event.queryStringParameters?.keyname;
  const item: DocumentClient.AttributeMap = await fetchProductByEmail(event.requestContext.authorizer.claims.email);
  const images = await s3
    .listObjects({
      Bucket: bucketName,
      Prefix: item.userID,
    })
    .promise();
  const availableImages = images.Contents.map((item) => item.Key.split("/").slice(-1)[0]);
  if (filename in availableImages) {
    const folderName: string = `${item.userID}/${filename}`;
    const deletedItem = await s3
      .deleteObject({
        Bucket: bucketName,
        Key: folderName,
      })
      .promise();
    return sendResponse(200, { message: "DELETED", deleted: deletedItem });
  } else {
    return sendResponse(404, { message: "Can't find this image into your folder" });
  }
};

export const listImages = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const item: DocumentClient.AttributeMap = await fetchProductByEmail(event.requestContext.authorizer.claims.email);
  const images = await s3
    .listObjects({
      Bucket: bucketName,
      Prefix: item.userID,
    })
    .promise();
  const imagesDir = images.Contents.map((item) => {
    return {
      imageName: item.Key.split("/").slice(-1)[0],
      url: `https://s3.console.aws.amazon.com/s3/object/${bucketName}?region=us-east-1&prefix=${item.Key}`,
    };
  });
  return sendResponse(200, { status: "Success", items: imagesDir });
};
