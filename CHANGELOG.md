# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
incorrect language first kiosk start #104655

## [2.6.1] - 2024-06-14
- Features:
  - handle non JWT refresh_token (ordering-core)

## [2.6.0] - 2024-05-21
- Features:
  - network token storage handler

## [2.5.1] - 2024-05-14
- Fix (ordering-core)
    - access token expiry checking
    - refresh token expiry checking
    - orders update callback on empty orders

## [2.5.0] - 2024-02-21
- Features:
  - App Insights warning disallowed roles
  - debug WS

## [2.4.0] - 2024-02-05
- Features:
  - Check for disallowed user roles

## [2.3.3] - 2023-11-16
- Features:
  - Device code login
  - Device code QR code with deviceUser

## [2.3.2] - 2023-11-15
- Features:
  - Device code login
  - Device code QR code

## [2.2.1] - 2023-11-03
- Security:
  - websocket disconnect on logout
  - update dependencies

## [2.2.0] - 2023-10-12
- Features:
  - steering commands

## [2.1.0] - 2023-09-14
- Features:
  - limit auth api calls with concurrent requests for access_token (ordering-core)

## [2.0.0] - 2023-05-17

- Breaking changes:
  - OrderWrapper => OrderProvider
  - Removed authContext option from OrderProvider props
- Features:
  - Websocket notification message callback

