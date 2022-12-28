import AWS from "aws-sdk";
import { sendResponse, validateInput } from "../utils/utils.js";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createUser } from "../db/handler.js";

const cognito = new AWS.CognitoIdentityServiceProvider();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const isValid = validateInput(event.body);
    if (!isValid) return sendResponse(400, { message: "Invalid input" });

    const { email, password } = JSON.parse(event.body);
    const { user_pool_id } = process.env;
    const params = {
      UserPoolId: user_pool_id,
      Username: email,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "email_verified",
          Value: "true",
        },
      ],
      MessageAction: "SUPPRESS",
    };
    const response = await cognito.adminCreateUser(params).promise();
    if (response.User) {
      const paramsForSetPass = {
        Password: password,
        UserPoolId: user_pool_id,
        Username: email,
        Permanent: true,
      };
      await cognito.adminSetUserPassword(paramsForSetPass).promise();
      await createUser(JSON.parse(event.body));
    }
    return sendResponse(200, { message: "User registration successful" });
  } catch (error: any) {
    const message = error.message ? error.message : "Internal server error";
    return sendResponse(500, { message });
  }
};
