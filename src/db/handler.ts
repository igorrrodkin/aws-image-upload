// import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { v4 } from "uuid";

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = "UsersTable2";

type Credentials = {
  email: string;
  password: string;
};

export const createUser = async (credentials: Credentials) => {
  const user = {
    ...credentials,
    userID: v4(),
  };

  await docClient
    .put({
      TableName: tableName,
      Item: user,
    })
    .promise();
};

export const fetchProductByEmail = async (email: string) => {
  const output = await docClient
    .get({
      TableName: tableName,
      Key: {
        email: email,
      },
    })
    .promise();
  return output.Item;
};
