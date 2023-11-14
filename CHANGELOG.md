# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
incorrect language first kiosk start #104655

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

