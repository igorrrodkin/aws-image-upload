export const sendResponse = (statusCode: number, body: Object) => {
  const response = {
    statusCode: statusCode,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
  };
  return response;
};

export const validateInput = (data: string): boolean => {
  const body = JSON.parse(data);
  const { email, password } = body;
  if (!email || !password || password.length < 8) return false;
  return true;
};
