const setTokenInCookie = (token, res) => {
  const options = {
    httpOnly: true,       
    secure: false,
    sameSite: "strict",     
    maxAge: ((60 * 60 * 1000) + 10000), // 1 hour in milliseconds
  };

  res.cookie("token", token, options);
};

export default setTokenInCookie;
