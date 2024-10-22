import jwt from "jsonwebtoken";

export default class AuthController {
  static tokenGenerator = (id) => {
    const token = jwt.sign({ id: id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d",
    });
    return token;
  };

  static generateResponse(
    status = 200,
    message = null,
    data = null,
    token = null
  ) {
    var response = {};

    response["status"] = status;
    response["data"] = data;
    response["message"] = message;
    if (token) {
      response["auth_token"] = token;
    }

    return response;
  }
}
