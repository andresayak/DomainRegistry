# Domain Registry Project

This project consists of three main components: a Solidity smart contract for domain registration and management, a React-based frontend for the user interface, and a NestJS backend handling server-side operations. The information is stored in a PostgreSQL database.

### Components
#### 1. Smart Contract (Solidity)
The smart contract, named DomainRegistry, is responsible for managing domain registrations. It allows users to reserve and manage domain names, with options for both Ether and ERC-20 token payments. The contract is upgradeable and inherits from OpenZeppelin's OwnableUpgradeable contract.

#### 2. Frontend (React)
The frontend folder contains a React application that provides a user-friendly interface for interacting with the smart contract. Users can reserve and manage domains, view domain information, and perform other actions through this interface.

#### 3. Backend (NestJS)
The backend, developed using NestJS, serves as the server-side logic for the project. It communicates with the PostgreSQL database to store and retrieve domain-related information. The backend is responsible for handling user requests from the frontend, interacting with the smart contract, and managing the overall flow of the application.

### Project Structure
frontend/: React-based user interface for interacting with the smart contract.

backend/: NestJS backend handling server-side operations and communication with the smart contract.

hardhat/: Solidity smart contract for domain registration and management.

### Contribution

Contributions to this project are welcome. If you find any issues or have improvements to suggest, please create a pull request or open an issue on the respective GitHub repositories.

### License
This project is licensed under the Unlicense - see the LICENSE file for details.