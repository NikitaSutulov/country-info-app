# Country Info App

This is a NestJS-based back-end app to provide information about countries and add holidays to the user’s calendar. It has three major endpoints:

1. `GET /countries` - get info about all the available countries;
2. `GET /countries/:countryCode` - get info about a particular country including info about bordering countries, population historical data and flag URL;
3. `POST /users/:userId/calendar/holidays` - add events in a particular country in a particular year. It requires a body with the example below:

```json
{
  "countryCode": "US",
  "year": 2025,
  "holidays": ["New Year's Day", "Independence Day"]
}
```

The `holidays` filter is optional.

To install and run the app, you need Node.js to be installed in your environment. Also, an existing PostgreSQL db needs to be available for connection.

1. Clone this repo (The '$' sign here just shows that the command is run in a terminal, and the user is not required to have root privileges, so do not copy it):

```sh
$ git clone https://github.com/NikitaSutulov/country-info-app.git
```

2. Go to the project root folder.
3. Install the dependencies:

```sh
$ npm install
```

4. Write your config into .env file. Its structure is the following:

```
NAGER_API_BASE_URL - Nager API base URL
COUNTRIES_NOW_API_BASE_URL - CountriesNow API base URL (including /countries)

DB_HOST - your host name
DB_PORT - your port number
DB_USERNAME - your db username
DB_PASSWORD - your db password
DB_NAME -your db name

JWT_SECRET - your JWT secret. Make sure it is secure enough
```

For these rows, write their values after '=' sign. For example:

```
DB_HOST=localhost
```

5. To launch the app, run this command:

```sh
$ npm run start:dev
```

The app can be tested manually.

To perform the testing of getting all available countries info, simply use the first of the major endpoints described at the beginning of this document.

To perform the testing of getting info about a particular country, simply use the second of the major endpoints described at the beginning of this document, replacing `:countryCode` with the two-letter code of the country you want to get info about.

To perform the testing of adding holidays to the user's calendar, you can create a user with a signup endpoint: `POST /users/signup`, providing the following JSON body:

```json
{
  "username": "your-username",
  "password": "your-password"
}
```

Then, login using `POST /users/login` with the same body. As the result, you get an object with the ID of your user and the access token to use in the future requests. It must be inserted into `Authorization` header, and a word `Bearer ` with a space after it must precede the token. For example:

```http
Authorization: Bearer token.is.here
```

This gives you the authorized access to the calendar of your user. Here, you can add holidays using the third major endpoint described at the beginning of this document, replacing `:userId` with the id of your user. To check the presence of the holidays, use the following endpoint: `GET /users/:userId/calendar/holidays`, replacing `:userId` with the id of your user. You will get the list of events saved in the user's calendar.
