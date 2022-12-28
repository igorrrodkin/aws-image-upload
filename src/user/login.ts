import AWS from "aws-sdk";
import { sendResponse, validateInput } from "../utils/utils.js";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const cognito = new AWS.CognitoIdentityServiceProvider();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return sendResponse(400, { message: "Fields are empty" });
    }
    const isValid = validateInput(event.body);
    if (!isValid) return sendResponse(400, { message: "Invalid input" });

    const { email, password } = JSON.parse(event.body);
    const { user_pool_id, client_id } = process.env;
    const params = {
      AuthFlow: "ADMIN_NO_SRP_AUTH",
      UserPoolId: user_pool_id,
      ClientId: client_id,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };
    const response = await cognito.adminInitiateAuth(params).promise();
    return sendResponse(200, {
      message: "Success",
      token: response.AuthenticationResult?.IdToken,
    });
  } catch (error: any) {
    const message = error.message ? error.message : "Internal server error";
    return sendResponse(500, { message });
  }
};
