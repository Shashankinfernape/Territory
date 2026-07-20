# TERRITORY (PropIt) - Engineering Documentation

Welcome to the official engineering documentation for the TERRITORY (PropIt) land marketplace progressive web app. 

This repository of documentation is intended to serve as the definitive source of truth for the system's architecture, business rules, workflows, and implementation details. It is designed to be comprehensive enough for a new engineering team to understand, maintain, and scale the platform.

## What is TERRITORY?

TERRITORY is a secure, full-stack Progressive Web App (PWA) designed for buying and selling verified agricultural and flat land plots in Tamil Nadu, India. It facilitates direct seller-to-buyer transactions, omitting middlemen. The platform emphasizes verified listings, secure document access via payment gateways, and extensive administrative oversight to ensure trust and reliability.

## Documentation Index

The documentation is organized sequentially to provide a complete understanding of the system, starting from high-level architecture down to specific workflows and operations.

### System Overview
* [01. Architecture & Tech Stack](./01_Architecture_and_Tech_Stack.md) - System design, component interaction, and technology choices.
* [02. Database Schema & Data Models](./02_Database_Schema.md) - MongoDB collections, fields, indexes, and relationships.
* [03. User Roles & Permissions](./03_User_Roles_and_Permissions.md) - Capabilities and transition rules for Buyers, Sellers, and Admins.
* [04. Authentication & Security](./04_Authentication_and_Security.md) - Firebase JWT implementation, token management, and secure endpoints.

### API & Codebase Structure
* [05. Backend API Reference](./05_Backend_API_Reference.md) - Detailed router documentation, request/response structures, and FastAPI endpoints.
* [06. Frontend Application Structure](./06_Frontend_Structure.md) - React component hierarchy, routing, context providers, and state management.

### Core Business Workflows
* [07a. User Registration Flow](./07_Core_Workflows/07a_User_Registration_Flow.md) - Sign-up processes and seller promotion mechanics.
* [07b. Property Listing & Approval Flow](./07_Core_Workflows/07b_Property_Listing_and_Approval_Flow.md) - Uploading properties, document handling, and admin approval constraints.
* [07c. Property Search & Recommendation Engine](./07_Core_Workflows/07c_Property_Search_and_Recommendation_Engine.md) - Query mechanics, filters, and the 3-tier recommendation algorithm.
* [07d. Payment & Document Unlocking Flow](./07_Core_Workflows/07d_Payment_and_Document_Unlocking_Flow.md) - Transaction processing, document gating, and access control.
* [07e. Property Deletion & Status Management](./07_Core_Workflows/07e_Property_Deletion_and_Status_Management.md) - Deletion request lifecycles, sold-out toggling, and business rule implementations.

### Operations & Maintenance
* [08. Admin Operations](./08_Admin_Operations.md) - Dashboard features, user/property moderation, and transaction management.
* [09. Environment & Configuration](./09_Environment_and_Configuration.md) - Required environment variables, setup instructions, and deployment configurations.

## How to use this documentation

* **New Developers:** Start with the [System Overview](#system-overview) section to grasp the big picture before diving into the API and Codebase Structure.
* **Feature Development:** Reference the [Core Business Workflows](#core-business-workflows) when modifying existing features to ensure you don't violate established business rules.
* **Bug Fixing:** The [API Reference](./05_Backend_API_Reference.md) and [Database Schema](./02_Database_Schema.md) serve as the authoritative sources for data shapes and expectations.

> **Note on Business Rules:** If you find discrepancies between the codebase and these documents, assume the documentation reflects the *intended* business logic, and the codebase may contain a bug (several known issues are documented throughout these files).
