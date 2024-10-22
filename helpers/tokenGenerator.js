import jwt from "jsonwebtoken";

const tokenGenerator = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET_KEY);
};

const inviteTokenGenerator = (
  memberId,
  invitedUserEmail,
  invitedByUserID = null
) => {
  return jwt.sign(
    {
      invitedByUserID,
      memberId,
      invitedUserEmail,
    },
    process.env.JWT_SECRET_KEY
  );
};

export { tokenGenerator, inviteTokenGenerator };
