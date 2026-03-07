export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
  demoCredentials: {
    admin: {
      username: 'steve@test.com',
      password: '123456',
    },
    guest: {
      username: 'demo@test.com',
      password: '123456',
    },
  },
  enableDemoEndpoints: true,
};