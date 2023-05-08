/**
 * Global environment variables
 */
const environment = {
  currentGoVersion: process.env.REACT_APP_GO_VERSION ?? '1.19',
  previousGoVersion: process.env.REACT_APP_PREV_GO_VERSION ?? '1.18',
};

export default environment;
