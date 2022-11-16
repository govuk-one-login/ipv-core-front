const axios = require("axios");
const axiosRequestHandler = (axiosRequest, req) => {
  req.log.info({
    message: {
      label: "axios request",
      method: axiosRequest.method?.toUpperCase(),
      url: axiosRequest.url,
      body: axiosRequest.data,
    },
  });
  return axiosRequest;
};
const axiosResponseHandler = (axiosResponse, req) => {
  req.log.info({
    message: {
      label: "AXIOS response",
      status: axiosResponse.status,
      method: axiosResponse.config?.method?.toUpperCase(),
      url: axiosResponse.config?.url,
      body: axiosResponse.data,
    },
  });
  return axiosResponse;
};
const axiosHandleError = (axiosError, req) => {
  req.log.error({
    message: {
      label: "AXIOS error",
      code: axiosError.code,
      message: axiosError.message,
    },
  });
  return Promise.reject(axiosError);
};

module.exports = {
  getAxios: (req) => {
    const customAxios = axios.create();

    customAxios.interceptors.request.use(
      (axiosRequest) => axiosRequestHandler(axiosRequest, req),
      (error) => axiosHandleError(error, req)
    );

    customAxios.interceptors.response.use(
      (axiosResponse) => axiosResponseHandler(axiosResponse, req),
      (error) => axiosHandleError(error, req)
    );

    return customAxios;
  },
  generateAxiosConfig: (req) => {
    return {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ipv-session-id": req.session.ipvSessionId,
        "x-request-id": req.id,
        "ip-address": req.session.ipAddress,
      },
    };
  },
  generateJsonAxiosConfig: (req) => {
    return {
      headers: {
        "Content-Type": "application/json",
        "ipv-session-id": req.session.ipvSessionId,
        "x-request-id": req.id,
        "ip-address": req.session.ipAddress,
      },
    };
  },
};
