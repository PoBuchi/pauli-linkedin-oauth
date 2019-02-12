LinkedIn = {}

const getImage = profilePicture => {
  const image = []
  for (const element of profilePicture['displayImage~']
    .elements) {
    for (const identifier of element.identifiers) {
      image.push(identifier.identifier)
    }
  }
  return {
    displayImage: profilePicture.displayImage,
    identifiersUrl: image,
  }
}

// Request for email, returns array
const getRegisteredEmails = function(accessToken) {
  const url = encodeURI(
    `https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))&oauth2_access_token=${accessToken}`,
  )
  const response = HTTP.get(url).data
  const emails = []
  for (const element of response.elements) {
    emails.push(element['handle~'].emailAddress)
  }
  return emails;
}

// checks whether a string parses as JSON
const isJSON = function(str) {
  try {
    JSON.parse(str)
    return true
  } catch (e) {
    return false
  }
}

// returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
const getTokenResponse = function(query) {
  const config = ServiceConfiguration.configurations.findOne(
    { service: 'linkedin' },
  )
  if (!config)
    throw new ServiceConfiguration.ConfigError(
      'Service not configured',
    )

  let responseContent
  try {
    // Request an access token
    responseContent = HTTP.post(
      'https://api.linkedin.com/uas/oauth2/accessToken',
      {
        params: {
          grant_type: 'authorization_code',
          client_id: config.clientId,
          client_secret: OAuth.openSecret(config.secret),
          code: query.code,
          redirect_uri: OAuth._redirectUri(
            'linkedin',
            config,
          ),
        },
      },
    ).content
  } catch (err) {
    throw new Error(
      `Failed to complete OAuth handshake with LinkedIn. ${
        err.message
      }`,
    )
  }

  // If 'responseContent' does not parse as JSON, it is an error.
  if (!isJSON(responseContent)) {
    throw new Error(
      `Failed to complete OAuth handshake with LinkedIn. ${responseContent}`,
    )
  }

  // Success! Extract access token and expiration
  const parsedResponse = JSON.parse(responseContent)
  const accessToken = parsedResponse.access_token
  const expiresIn = parsedResponse.expires_in

  if (!accessToken) {
    throw new Error(
      'Failed to complete OAuth handshake with LinkedIn ' +
        `-- can't find access token in HTTP response. ${responseContent}`,
    )
  }

  return {
    accessToken,
    expiresIn,
  }
}

// Request available fields from r_liteprofile
const getIdentity = function(accessToken) {
  try {
    const url = encodeURI(
      `https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))&oauth2_access_token=${accessToken}`,
    )
    return HTTP.get(url).data
  } catch (err) {
    throw new Error(
      `Failed to fetch identity from LinkedIn. ${
        err.message
      }`,
    )
  }
}

OAuth.registerService('linkedin', 2, null, query => {
  const response = getTokenResponse(query)
  const accessToken = response.accessToken
  const identity = getIdentity(accessToken)

  const {
    id,
    firstName,
    lastName,
    profilePicture,
  } = identity

  if (!id) {
    throw new Error('LinkedIn did not provide an id')
  }
  const serviceData = {
    id,
    accessToken,
    expiresAt: +new Date() + 1000 * response.expiresIn,
  }

  const registeredEmails = getRegisteredEmails(accessToken)

  const fields = {
    linkedinId: id,
    firstName,
    lastName,
    profilePicture: getImage(profilePicture),
    registeredEmails,
  }

  if (registeredEmails.length) {
    const primaryEmail = registeredEmails[0]
    fields.emailAddress = primaryEmail;
    fields.email = primaryEmail;
  }

  _.extend(serviceData, fields)

  return {
    serviceData,
    options: {
      profile: fields,
    },
  }
})

LinkedIn.retrieveCredential = function(
  credentialToken,
  credentialSecret,
) {
  return OAuth.retrieveCredential(
    credentialToken,
    credentialSecret,
  )
}
