# Change Log

All notable changes to the **OpenComputersTS** extension will be documented in this file.

## 0.2.1 - 2021-05-10

### Fixed

- Update tsconfig to use tstl language exstensions

## 0.2.0 - 2020-04-08

### Fixed

- Invalid versioning.
- Missed npm dependency.

## 0.1.3 - 2020-04-08 [YANKED]

### Added

- `tsdbg` - Simple debugger for OpenOS.
- `OC-TS: Install client` - Command for installing client to OC disk.
- OS Detection in `OC-TS: Mount` and `OC-TS: Install client` commands.

### Changed

- `OC-TS: Init` command now adds `.vscode` folder with debugger configuration.

## 0.0.3

### Added

- `oc-ts.paths` property to set save folders.

## 0.0.2

### Fixed

- `OC-TS: Mount` command now shows an error if no save or emulator was found.
- `OC-TS: Mount` command now works if saves directory contains files or worlds without OC folder.

## 0.0.1

### Added

- `OC-TS: Init` command to initialize new project in empty folder.
- `OC-TS: Mount` command to create link from `dist` to OC disk.
