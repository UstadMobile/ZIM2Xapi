# JS Tests

## Overview
This project (`js-tests`) contains automated testing using both **Cypress** for end-to-end (E2E) testing and **Jest** for unit testing. Cypress is used for simulating user interactions and validating workflows in a browser, while Jest is used for testing JavaScript logic and functions.

## Prerequisites
Before running the tests, ensure that you have the following tools installed:

- **Node.js** and **npm**: For managing dependencies and running JavaScript tests.
- **Java JDK**: Required to build the project.

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   ```

2. **Build the Project**

   Run the following command from the root directory:
   ```bash
   ./gradlew build
   ```

   This step ensures that all necessary files are generated and ready for testing. The JAR file will be located in jstests/build/libs.


2. **Install Dependencies**
   
   Use `npm` to install all necessary dependencies for both Cypress and Jest.
   ```bash
   cd js-tests
   npm install
   ```

## Running Tests

### Running Cypress End-to-End Tests

Cypress is used for E2E tests to validate the UI workflows.

**Start the Test Server and Run Cypress**
   
   To run the **Cypress tests**, use the following command:
   
   ```bash
   npm run test:e2e
   ```
   
   This command will:
   - Start a local server using `http-server` on port **8081**.
   - Run Cypress in headless mode(without UI)

### Running Unit Tests with Jest

To run **unit tests** using Jest, use the following command:

```bash
npm run test
```

This will run all tests defined in the project using the **Jest** framework.

## Available Scripts

- **`npm run test`**: Runs **Jest** unit tests.
- **`npm run cypress:open`**: Opens the Cypress test runner in interactive mode.
- **`npm run cypress:run`**: Runs Cypress tests in headless mode.
- **`npm run start-server`**: Starts a local server at `e2e/temp-content` on port **8081**.
- **`npm run test:e2e`**: Starts the local server and runs Cypress for E2E testing.

## Notes

- Ensure you have run `./gradlew build` before executing Cypress E2E tests.
- **Cypress** requires the server to be running (`http-server`) in order to access the test content.
- Use **`test:e2e`** to automate both server startup and Cypress testing.

