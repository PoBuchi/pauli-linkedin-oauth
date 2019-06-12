Package.describe({
  name: 'pauli:linkedin-oauth',
  version: '5.0.0',
  summary: 'LinkedIn OAuth flow, use with Meteor 1.6.1 & up',
  git: 'https://github.com/PoBuchi/pauli-linkedin-oauth',
  documentation: 'README.md'
});

Package.onUse(api => {
  api.versionsFrom('1.6.1');
  api.use('ecmascript');
  api.use('oauth2', ['client', 'server']);
  api.use('oauth', ['client', 'server']);
  api.use('http', ['server']);
  api.use('underscore', 'server');
  api.use('random', 'client');
  api.use('service-configuration', ['client', 'server']);

  api.addFiles('linkedin-client.js', 'client');
  api.addFiles('linkedin-server.js', 'server');

  api.export('Linkedin');
});

