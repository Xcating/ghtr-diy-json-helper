# GhTr DIY JSON Helper

![Extension Logo](https://via.placeholder.com/150) <!-- Replace with your actual logo -->

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Installation](#installation)
4. [Usage](#usage)
    - [Using Commands](#using-commands)
    - [Using Keyboard Shortcuts](#using-keyboard-shortcuts)
5. [Detailed Feature Descriptions](#detailed-feature-descriptions)
    - [1. Insert Zombie](#1-insert-zombie)
    - [2. Clear Wave](#2-clear-wave)
    - [3. Clear All Waves](#3-clear-all-waves)
    - [4. Create Template](#4-create-template)
    - [5. Generate Summary](#5-generate-summary)
6. [Examples](#examples)
7. [Configuration](#configuration)
8. [Contributing](#contributing)
9. [License](#license)
10. [Acknowledgements](#acknowledgements)

## Introduction

Welcome to **GhTr DIY JSON Helper**, a powerful Visual Studio Code (VS Code) extension designed to streamline the process of creating and managing JSON-based levels for the **GhTr DIY** game. Whether you're a game developer, designer, or enthusiast, this extension offers a suite of tools to enhance your workflow, reduce errors, and increase productivity when working with level configurations.

## Features

GhTr DIY JSON Helper offers the following features:

1. **Insert Zombie**: Easily add zombies to specific waves and rows within your level files.
2. **Clear Wave**: Remove all zombies from a specified wave.
3. **Clear All Waves**: Remove all zombies from all waves in a single action.
4. **Create Template**: Generate a new level template with customizable parameters.
5. **Generate Summary**: Create a comprehensive summary of your level, including zombie statistics and wave information.

Additionally, the extension provides:

- **Auto-completion**: Suggests zombie types as you type.
- **JSON Validation**: Ensures your JSON files adhere to the correct schema, highlighting syntax errors and invalid entries.
- **Keyboard Shortcuts**: Quickly access all features using predefined or customizable keyboard shortcuts.

## Installation

You can install GhTr DIY JSON Helper directly from the VS Code Marketplace or by using the VS Code extension command.

### From the VS Code Marketplace

1. Open VS Code.
2. Navigate to the **Extensions** view by clicking on the Extensions icon in the Activity Bar on the side of the window or by pressing `Ctrl+Shift+X`.
3. In the search bar, type `GhTr DIY JSON Helper`.
4. Locate the extension in the search results and click **Install**.
5. After installation, you might need to reload VS Code to activate the extension.

### Using the Command Line

1. Ensure you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
2. Open your terminal or command prompt.
3. Navigate to your VS Code extensions directory, typically found at:
    - **Windows**: `%USERPROFILE%\.vscode\extensions`
    - **macOS/Linux**: `~/.vscode/extensions`
4. Clone or download the extension repository.
5. Navigate into the extension folder and run:
    ```bash
    npm install
    npm run compile
    ```
6. Package the extension using:
    ```bash
    vsce package
    ```
7. Install the generated `.vsix` file by running:
    ```bash
    code --install-extension your-extension-name.vsix
    ```

## Usage

Once installed, GhTr DIY JSON Helper enhances your workflow when working with GhTr DIY level JSON files. Here's how to get started:

### Using Commands

1. **Open a Level File**: Open a JSON file located within the `levels` directory of your project (e.g., `levels/level1.json`).

2. **Accessing Commands**:
    - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the Command Palette.
    - Type `GhTr DIY` to filter and view available commands.
    - Select the desired command from the list.

### Using Keyboard Shortcuts

For faster access, GhTr DIY JSON Helper provides predefined keyboard shortcuts:

- **Insert Zombie**: `Ctrl+Alt+Z`
- **Clear Wave**: `Ctrl+Alt+C`
- **Clear All Waves**: `Ctrl+Alt+Shift+C`
- **Create Template**: `Ctrl+Alt+T`
- **Generate Summary**: `Ctrl+Alt+S`

*Note*: You can customize these shortcuts by navigating to **File > Preferences > Keyboard Shortcuts** and searching for the respective command names.

## Detailed Feature Descriptions

### 1. Insert Zombie

**Command**: `ghtr-diy.insertZombie`  
**Shortcut**: `Ctrl+Alt+Z`

**Description**:  
Allows you to add a zombie of a specified type to a particular wave and row within your level file. This ensures consistency and accuracy when designing your levels.

**Usage Steps**:

1. **Trigger the Command**:
    - Use the shortcut `Ctrl+Alt+Z` or access it via the Command Palette (`Ctrl+Shift+P` > `GhTr DIY: Insert Zombie`).

2. **Select Zombie Type**:
    - A dropdown will appear with a list of available zombie types:
        - `NORMALZOMBIE`
        - `FLAGZOMBIE`
        - `CONEZOMBIE`
        - `BUCKETZOMBIE`
        - `POLEZOMBIE`
        - `FIREFLYZOMBIE`
        - `ARROWZOMBIE`
        - `WITCHZOMBIE`
        - `INFROLLZOMBIE`
        - `MAGTRUCKZOMBIE`
        - `HAMSTERZOMBIE`
        - `NULLZOMBIE`
        - `ENDNULLZOMBIE`
    - Select the desired type.

3. **Enter Wave Number**:
    - Input the wave number (integer starting from 1) where you want to insert the zombie.
    - Example: Enter `3` to add the zombie to the third wave.

4. **Enter Row Number**:
    - Input the row number (0 to 4, `-1` for random, `-2` for the weakest row).
    - Example: Enter `2` to place the zombie in the second row.

5. **Confirmation**:
    - Upon successful insertion, a confirmation message will appear:  
      `已在第 3 波的第 2 行插入 NORMALZOMBIE。`

**Notes**:

- The extension ensures that the `NULLZOMBIE` separators between waves remain intact.
- If the specified wave does not exist, it will be created automatically.
- The row number helps in organizing zombies vertically within a wave.

### 2. Clear Wave

**Command**: `ghtr-diy.clearWave`  
**Shortcut**: `Ctrl+Alt+C`

**Description**:  
Removes all zombies from a specified wave, allowing you to reset or modify that wave without affecting others.

**Usage Steps**:

1. **Trigger the Command**:
    - Use the shortcut `Ctrl+Alt+C` or access it via the Command Palette (`Ctrl+Shift+P` > `GhTr DIY: Clear Wave`).

2. **Enter Wave Number**:
    - Input the wave number (integer starting from 1) you wish to clear.
    - Example: Enter `2` to clear all zombies in the second wave.

3. **Confirmation**:
    - After successful clearance, a confirmation message will appear:  
      `已清空第 2 波的所有僵尸。`

**Notes**:

- This action only affects the specified wave, leaving other waves unchanged.
- The extension maintains the `NULLZOMBIE` separators to ensure the JSON structure remains valid.

### 3. Clear All Waves

**Command**: `ghtr-diy.clearAllWaves`  
**Shortcut**: `Ctrl+Alt+Shift+C`

**Description**:  
Allows you to remove all zombies from all waves in your level file in one action, effectively resetting the level's zombie configurations.

**Usage Steps**:

1. **Trigger the Command**:
    - Use the shortcut `Ctrl+Alt+Shift+C` or access it via the Command Palette (`Ctrl+Shift+P` > `GhTr DIY: Clear All Waves`).

2. **Confirmation Prompt**:
    - A warning message will appear:  
      `确定要清空所有波数的所有僵尸吗？此操作不可撤销。`
    - Click **Yes** to proceed or **Cancel** to abort.

3. **Confirmation**:
    - Upon successful clearance, a confirmation message will appear:  
      `已清空所有波数的所有僵尸。`

**Notes**:

- This action is irreversible. Ensure you have backups or are certain before proceeding.
- Only the `ZombieList` will be cleared; other level parameters like `Sun` and `Background` remain intact.

### 4. Create Template

**Command**: `ghtr-diy.createTemplate`  
**Shortcut**: `Ctrl+Alt+T`

**Description**:  
Generates a new level template JSON file based on user-specified parameters such as initial sun amount, total waves, and background ID.

**Usage Steps**:

1. **Trigger the Command**:
    - Use the shortcut `Ctrl+Alt+T` or access it via the Command Palette (`Ctrl+Shift+P` > `GhTr DIY: Create Template`).

2. **Enter Initial Sun Amount**:
    - Input the starting sun amount (integer).
    - Example: Enter `100` for an initial sun amount of 100.

3. **Enter Total Waves**:
    - Input the total number of waves (integer).
    - Example: Enter `10` for ten waves.

4. **Enter Background ID**:
    - Input the background ID (integer) corresponding to the desired background.
    - Example: Enter `3` for background number 3.

5. **Choose Save Location**:
    - A dialog will prompt you to select where to save the new template JSON file.
    - Choose the desired directory and filename (e.g., `levels/new_level.json`).

6. **Confirmation**:
    - Upon successful creation, a confirmation message will appear:  
      `DIY 模板示例文件已创建。`

**Notes**:

- The generated template includes an empty `ZombieList`, ready for you to populate with zombies using other extension features.
- Ensure the save location is within your project’s `levels` directory for optimal organization.

### 5. Generate Summary

**Command**: `ghtr-diy.generateSummary`  
**Shortcut**: `Ctrl+Alt+S`

**Description**:  
Analyzes the current level JSON file and generates a comprehensive summary, including zombie statistics, wave information, and overall level metrics. The summary is saved as a Markdown file for easy readability and sharing.

**Usage Steps**:

1. **Trigger the Command**:
    - Use the shortcut `Ctrl+Alt+S` or access it via the Command Palette (`Ctrl+Shift+P` > `GhTr DIY: Generate Summary`).

2. **Process Level File**:
    - The extension parses the current JSON file, analyzing the `ZombieList` and other parameters.

3. **Choose Save Location**:
    - A dialog will prompt you to select where to save the summary Markdown file.
    - Choose the desired directory and filename (e.g., `levels/level1_summary.md`).

4. **Confirmation**:
    - Upon successful generation, a confirmation message will appear:  
      `关卡总结已生成。`

5. **View Summary**:
    - Open the generated Markdown file in VS Code to view the detailed summary.

**Generated Summary Includes**:

- **Initial Sun Amount**: The starting sun count for the level.
- **Background ID**: The background used in the level.
- **Total Waves**: Number of waves in the level.
- **Rhythm**: Categorized as slow, moderate, or fast based on wave count.
- **Zombie Strength**: Overall intensity categorized as low, medium, or high based on total zombies.
- **Zombie Table**: Detailed list of zombies per wave and row.
- **Zombie Statistics**: Count of each zombie type used in the level.

**Notes**:

- The summary is formatted in Markdown, making it easy to read and share.
- Useful for documentation, level reviews, or collaborative development.

## Examples

### Example 1: Inserting a Zombie

Suppose you want to add a `CONEZOMBIE` to the third wave in the second row.

1. Open your level file (e.g., `levels/level1.json`).
2. Press `Ctrl+Alt+Z` to trigger the **Insert Zombie** command.
3. Select `CONEZOMBIE` from the dropdown.
4. Enter `3` when prompted for the wave number.
5. Enter `2` when prompted for the row number.
6. A confirmation message appears:  
   `已在第 3 波的第 2 行插入 CONEZOMBIE。`

### Example 2: Clearing a Specific Wave

To clear all zombies from the second wave:

1. Open your level file.
2. Press `Ctrl+Alt+C` to trigger the **Clear Wave** command.
3. Enter `2` when prompted for the wave number.
4. A confirmation message appears:  
   `已清空第 2 波的所有僵尸。`

### Example 3: Creating a New Template

To create a new level template with 150 initial sun, 12 waves, and background ID 4:

1. Press `Ctrl+Alt+T` to trigger the **Create Template** command.
2. Enter `150` for the initial sun amount.
3. Enter `12` for the total number of waves.
4. Enter `4` for the background ID.
5. Choose the save location and filename (e.g., `levels/level_new.json`).
6. A confirmation message appears:  
   `DIY 模板示例文件已创建。`

### Example 4: Generating a Summary

To generate a summary for your current level file:

1. Open your level file.
2. Press `Ctrl+Alt+S` to trigger the **Generate Summary** command.
3. Choose the save location and filename (e.g., `levels/level1_summary.md`).
4. A confirmation message appears:  
   `关卡总结已生成。`
5. Open the generated `level1_summary.md` to view the detailed summary.

## Configuration

GhTr DIY JSON Helper comes pre-configured with default settings tailored for optimal performance. However, you can customize certain aspects to better fit your workflow.

### Customizing Keyboard Shortcuts

If you wish to change the default keyboard shortcuts:

1. Navigate to **File > Preferences > Keyboard Shortcuts**.
2. Search for the specific command name, such as `GhTr DIY: Insert Zombie`.
3. Click on the existing shortcut or the `+` icon to add a new keybinding.
4. Press the desired key combination and confirm.

### JSON Schema Validation

The extension validates your level JSON files against a predefined schema to ensure correctness. You can customize or extend the schema by modifying the `schemas/ghtr-diy-schema.json` file within the extension's directory.

**Note**: Be cautious when modifying the schema to prevent introducing validation errors.

### Extension Settings

Currently, the extension does not expose specific settings to the user. Future updates may include customizable settings to enhance flexibility.

## Contributing

Contributions are welcome! Whether you're reporting bugs, suggesting features, or submitting pull requests, your input helps improve GhTr DIY JSON Helper.

### How to Contribute

1. **Fork the Repository**: Click the **Fork** button on the repository page to create your own copy.

2. **Clone Your Fork**:
    ```bash
    git clone https://github.com/your-username/ghtr-diy-json-helper.git
    ```

3. **Navigate to the Project Directory**:
    ```bash
    cd ghtr-diy-json-helper
    ```

4. **Install Dependencies**:
    ```bash
    npm install
    ```

5. **Make Your Changes**:
    - Implement your feature or bug fix.
    - Ensure your code adheres to the project's coding standards.

6. **Compile the Extension**:
    ```bash
    npm run compile
    ```

7. **Test Your Changes**:
    - Open the project in VS Code.
    - Press `F5` to launch a new Extension Development Host.
    - Test your changes thoroughly.

8. **Commit and Push**:
    ```bash
    git add .
    git commit -m "Description of your changes"
    git push origin your-branch-name
    ```

9. **Create a Pull Request**:
    - Navigate to your fork on GitHub.
    - Click **New Pull Request**.
    - Provide a clear description of your changes and submit.

### Reporting Issues

If you encounter any issues or have suggestions for improvements:

1. Navigate to the [Issues](https://github.com/your-username/ghtr-diy-json-helper/issues) section of the repository.
2. Click **New Issue**.
3. Provide a descriptive title and detailed description, including steps to reproduce the issue if applicable.
4. Submit the issue.

### Code of Conduct

Please adhere to the [Code of Conduct](CODE_OF_CONDUCT.md) when participating in this project.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- **Visual Studio Code**: The extensible code editor that makes this extension possible.
- **OpenAI**: For providing the foundational AI technologies.
- **GhTr DIY Community**: For continuous feedback and support, helping shape the development of this extension.

---

*Happy Level Designing!*