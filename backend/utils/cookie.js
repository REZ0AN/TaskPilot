const setTokenInCookie = (token, res) => {
  const options = {
    httpOnly: true,       
    secure: false,
    sameSite: "strict",     
    maxAge: ((60 * 60 * 1000) + 10000), // 1 hour in milliseconds
  };

  res.cookie("token", token, options);
};

const clearTokenCookie = (res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  });
};

export { clearTokenCookie, setTokenInCookie };
