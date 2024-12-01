import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('ghtr-diy');

    if (vscode.window.activeTextEditor) {
        validateDocument(vscode.window.activeTextEditor.document, diagnosticCollection);
    }
  
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
        validateDocument(e.document, diagnosticCollection);
    }));
  
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => {
        diagnosticCollection.delete(doc.uri);
    }));

    const provider = vscode.languages.registerCompletionItemProvider(
        { language: 'json', scheme: 'file', pattern: '**/levels/*.json' },
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('"Type": "')) {
                    return undefined;
                }

                const types = [
                    'NORMALZOMBIE',
                    'FLAGZOMBIE',
                    'CONEZOMBIE',
                    'BUCKETZOMBIE',
                    'POLEZOMBIE',
                    'FIREFLYZOMBIE',
                    'ARROWZOMBIE',
                    'WITCHZOMBIE',
                    'INFROLLZOMBIE',
                    'MAGTRUCKZOMBIE',
                    'HAMSTERZOMBIE',
                    'NULLZOMBIE',
                    'ENDNULLZOMBIE'
                ];

                return types.map(type => new vscode.CompletionItem(type, vscode.CompletionItemKind.Enum));
            }
        },
        '"' // trigger on "
    );

    context.subscriptions.push(provider);

    // 注册插入僵尸命令
    const insertZombieCommand = vscode.commands.registerCommand('ghtr-diy.insertZombie', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('请打开一个JSON文件进行操作。');
            return;
        }

        const document = editor.document;

        // 仅在 JSON 文件中工作，且路径包含 /levels/
        if (document.languageId !== 'json' || !document.uri.fsPath.includes('/levels/')) {
            vscode.window.showErrorMessage('此命令仅适用于 levels/*.json 文件。');
            return;
        }

        // 提示用户输入僵尸类型
        const zombieType = await vscode.window.showQuickPick([
            'NORMALZOMBIE',
            'FLAGZOMBIE',
            'CONEZOMBIE',
            'BUCKETZOMBIE',
            'POLEZOMBIE',
            'FIREFLYZOMBIE',
            'ARROWZOMBIE',
            'WITCHZOMBIE',
            'INFROLLZOMBIE',
            'MAGTRUCKZOMBIE',
            'HAMSTERZOMBIE',
            'NULLZOMBIE',
            'ENDNULLZOMBIE'
        ], {
            placeHolder: '选择僵尸类型'
        });

        if (!zombieType) {
            return; // 用户取消
        }

        // 提示用户输入波数
        const waveInput = await vscode.window.showInputBox({
            prompt: '输入波数 (整数，从1开始)',
            validateInput: (value) => {
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 1) {
                    return '请输入一个有效的正整数。';
                }
                return null;
            }
        });

        if (!waveInput) {
            return;
        }

        const wave = parseInt(waveInput, 10);

        // 提示用户输入行数
        const rowInput = await vscode.window.showInputBox({
            prompt: '输入行数 (0~4，-1随机，-2选择最弱行)',
            validateInput: (value) => {
                const num = parseInt(value, 10);
                if (isNaN(num) || num < -2 || num > 4) {
                    return '请输入一个有效的行数 (-2, -1, 0, 1, 2, 3, 4)。';
                }
                return null;
            }
        });

        if (!rowInput) {
            return;
        }

        const row = parseInt(rowInput, 10);

        // 开始编辑
        await editor.edit(editBuilder => {
            const text = document.getText();
            let json: any;
            try {
                json = JSON.parse(text);
            } catch (error) {
                vscode.window.showErrorMessage('JSON 解析错误，无法插入僵尸。');
                return;
            }

            if (!json.ZombieList || !Array.isArray(json.ZombieList)) {
                vscode.window.showErrorMessage('ZombieList 不存在或格式不正确。');
                return;
            }

            // 确定波数的起始位置
            const zombiesPerWave: any[][] = [];
            let currentWave: any[] = [];

            json.ZombieList.forEach((zombie: any) => {
                if (zombie.Type === 'NULLZOMBIE') {
                    zombiesPerWave.push(currentWave);
                    currentWave = [];
                } else {
                    currentWave.push(zombie);
                }
            });			
            // 添加最后一波
            if (currentWave.length > 0) {
                zombiesPerWave.push(currentWave);
            }

            // 确保波数存在
            while (zombiesPerWave.length < wave) {
                zombiesPerWave.push([]);
                zombiesPerWave.push([{ Type: 'NULLZOMBIE', Row: 0 }]); // 添加 NULLZOMBIE 作为分隔
            }

            // 获取指定波的僵尸列表
            const targetWaveIndex = wave - 1;
            let targetWave = zombiesPerWave[targetWaveIndex];

            // 如果目标波后没有 NULLZOMBIE，则添加一个
            if (zombiesPerWave.length <= targetWaveIndex + 1 || (zombiesPerWave[targetWaveIndex + 1].length > 0 && zombiesPerWave[targetWaveIndex + 1][0].Type !== 'NULLZOMBIE')) {
                zombiesPerWave.splice(targetWaveIndex + 1, 0, [{ Type: 'NULLZOMBIE', Row: 0 }]);
            }

            // 创建新的僵尸对象
            const newZombie: any = { Type: zombieType, Row: row };
            // 可以根据需要扩展更多字段，例如 LowDif 等
            // if (someCondition) {
            //     newZombie.LowDif = someValue;
            // }

            // 插入到目标波
            targetWave.push(newZombie);

            // 重新构建 ZombieList
            const newZombieList: any[] = [];
            zombiesPerWave.forEach(waveZombies => {
                newZombieList.push(...waveZombies);
                // 添加 NULLZOMBIE 作为分隔符
                if (waveZombies.length > 0 && waveZombies[waveZombies.length - 1].Type !== 'NULLZOMBIE') {
                    newZombieList.push({ Type: 'NULLZOMBIE', Row: 0 });
                }
            });

            // 移除最后一个多余的 NULLZOMBIE
            if (newZombieList.length > 0 && newZombieList[newZombieList.length - 1].Type === 'NULLZOMBIE') {
                newZombieList.pop();
            }

            // 转换回 JSON 字符串
            const newText = JSON.stringify({ ...json, ZombieList: newZombieList }, null, 4);

            // 替换整个文档内容
            editBuilder.replace(new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            ), newText);
        });

        vscode.window.showInformationMessage(`已在第 ${wave} 波的第 ${row} 行插入 ${zombieType}。`);
    });

    context.subscriptions.push(insertZombieCommand);

    // 注册清空指定波数的所有僵尸命令
    const clearWaveCommand = vscode.commands.registerCommand('ghtr-diy.clearWave', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('请打开一个JSON文件进行操作。');
            return;
        }

        const document = editor.document;

        // 仅在 JSON 文件中工作，且路径包含 /levels/
        if (document.languageId !== 'json' || !document.uri.fsPath.includes('/levels/')) {
            vscode.window.showErrorMessage('此命令仅适用于 levels/*.json 文件。');
            return;
        }

        // 提示用户输入波数
        const waveInput = await vscode.window.showInputBox({
            prompt: '输入要清空的波数 (整数，从1开始)',
            validateInput: (value) => {
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 1) {
                    return '请输入一个有效的正整数。';
                }
                return null;
            }
        });

        if (!waveInput) {
            return;
        }

        const wave = parseInt(waveInput, 10);

        // 开始编辑
        await editor.edit(editBuilder => {
            const text = document.getText();
            let json: any;
            try {
                json = JSON.parse(text);
            } catch (error) {
                vscode.window.showErrorMessage('JSON 解析错误，无法清空僵尸。');
                return;
            }

            if (!json.ZombieList || !Array.isArray(json.ZombieList)) {
                vscode.window.showErrorMessage('ZombieList 不存在或格式不正确。');
                return;
            }

            // 确定波数的起始位置
            const zombiesPerWave: any[][] = [];
            let currentWave: any[] = [];

            json.ZombieList.forEach((zombie: any) => {
                if (zombie.Type === 'NULLZOMBIE') {
                    zombiesPerWave.push(currentWave);
                    currentWave = [];
                } else {
                    currentWave.push(zombie);
                }
            });			
            // 添加最后一波
            if (currentWave.length > 0) {
                zombiesPerWave.push(currentWave);
            }

            if (wave > zombiesPerWave.length) {
                vscode.window.showErrorMessage(`波数 ${wave} 不存在。`);
                return;
            }

            // 清空指定波数的僵尸
            zombiesPerWave[wave - 1] = [];

            // 重新构建 ZombieList
            const newZombieList: any[] = [];
            zombiesPerWave.forEach(waveZombies => {
                newZombieList.push(...waveZombies);
                // 添加 NULLZOMBIE 作为分隔符
                if (waveZombies.length > 0 && waveZombies[waveZombies.length - 1].Type !== 'NULLZOMBIE') {
                    newZombieList.push({ Type: 'NULLZOMBIE', Row: 0 });
                }
            });

            // 移除最后一个多余的 NULLZOMBIE
            if (newZombieList.length > 0 && newZombieList[newZombieList.length - 1].Type === 'NULLZOMBIE') {
                newZombieList.pop();
            }

            // 转换回 JSON 字符串
            const newText = JSON.stringify({ ...json, ZombieList: newZombieList }, null, 4);

            // 替换整个文档内容
            editBuilder.replace(new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            ), newText);
        });

        vscode.window.showInformationMessage(`已清空第 ${wave} 波的所有僵尸。`);
    });

    context.subscriptions.push(clearWaveCommand);

    // 注册清空所有波数的所有僵尸命令
    const clearAllWavesCommand = vscode.commands.registerCommand('ghtr-diy.clearAllWaves', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('请打开一个JSON文件进行操作。');
            return;
        }

        const document = editor.document;

        // 仅在 JSON 文件中工作，且路径包含 /levels/
        if (document.languageId !== 'json' || !document.uri.fsPath.includes('/levels/')) {
            vscode.window.showErrorMessage('此命令仅适用于 levels/*.json 文件。');
            return;
        }

        // 确认操作
        const confirm = await vscode.window.showWarningMessage('确定要清空所有波数的所有僵尸吗？此操作不可撤销。', { modal: true }, 'Yes');

        if (confirm !== 'Yes') {
            return;
        }

        // 开始编辑
        await editor.edit(editBuilder => {
            const text = document.getText();
            let json: any;
            try {
                json = JSON.parse(text);
            } catch (error) {
                vscode.window.showErrorMessage('JSON 解析错误，无法清空僵尸。');
                return;
            }

            if (!json.ZombieList || !Array.isArray(json.ZombieList)) {
                vscode.window.showErrorMessage('ZombieList 不存在或格式不正确。');
                return;
            }

            // 清空所有波数的僵尸
            json.ZombieList = [];

            // 转换回 JSON 字符串
            const newText = JSON.stringify(json, null, 4);

            // 替换整个文档内容
            editBuilder.replace(new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            ), newText);
        });

        vscode.window.showInformationMessage('已清空所有波数的所有僵尸。');
    });

    context.subscriptions.push(clearAllWavesCommand);

    // 注册创建模板示例文件命令
    const createTemplateCommand = vscode.commands.registerCommand('ghtr-diy.createTemplate', async () => {
        // 提示用户输入模板参数
        const sunInput = await vscode.window.showInputBox({
            prompt: '输入初始阳光量 (整数)',
            validateInput: (value) => {
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 0) {
                    return '请输入一个有效的非负整数。';
                }
                return null;
            }
        });

        if (!sunInput) {
            return;
        }

        const sun = parseInt(sunInput, 10);

        const wavesInput = await vscode.window.showInputBox({
            prompt: '输入总波数 (整数)',
            validateInput: (value) => {
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 1) {
                    return '请输入一个有效的正整数。';
                }
                return null;
            }
        });

        if (!wavesInput) {
            return;
        }

        const waves = parseInt(wavesInput, 10);

        const backgroundInput = await vscode.window.showInputBox({
            prompt: '输入背景编号 (整数)',
            validateInput: (value) => {
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 0) {
                    return '请输入一个有效的非负整数。';
                }
                return null;
            }
        });

        if (!backgroundInput) {
            return;
        }

        const background = parseInt(backgroundInput, 10);

        // 创建模板对象
        const template = {
            Sun: sun,
            Waves: waves,
            Background: background,
            ZombieList: []
        };

        // 转换为 JSON 字符串
        const templateText = JSON.stringify(template, null, 4);

        // 提示用户选择保存位置
        const saveUri = await vscode.window.showSaveDialog({
            filters: { 'JSON Files': ['json'] },
            defaultUri: vscode.Uri.file(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : ''),
            saveLabel: 'Save Template'
        });

        if (!saveUri) {
            return;
        }

        // 写入文件
        try {
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(templateText, 'utf8'));
            vscode.window.showInformationMessage('DIY 模板示例文件已创建。');
        } catch (error) {
            vscode.window.showErrorMessage('无法创建模板文件：' + error);
        }
    });

    context.subscriptions.push(createTemplateCommand);

    // 注册生成关卡总结命令
    const generateSummaryCommand = vscode.commands.registerCommand('ghtr-diy.generateSummary', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('请打开一个JSON文件进行操作。');
            return;
        }

        const document = editor.document;

        // 仅在 JSON 文件中工作，且路径包含 /levels/
        if (document.languageId !== 'json' || !document.uri.fsPath.includes('/levels/')) {
            vscode.window.showErrorMessage('此命令仅适用于 levels/*.json 文件。');
            return;
        }

        // 读取文档内容
        const text = document.getText();
        let json: any;
        try {
            json = JSON.parse(text);
        } catch (error) {
            vscode.window.showErrorMessage('JSON 解析错误，无法生成总结。');
            return;
        }

        if (!json.ZombieList || !Array.isArray(json.ZombieList)) {
            vscode.window.showErrorMessage('ZombieList 不存在或格式不正确。');
            return;
        }

        // 生成出怪表
        const zombiesPerWave: any[][] = [];
        let currentWave: any[] = [];

        json.ZombieList.forEach((zombie: any) => {
            if (zombie.Type === 'NULLZOMBIE') {
                zombiesPerWave.push(currentWave);
                currentWave = [];
            } else {
                currentWave.push(zombie);
            }
        });			
        // 添加最后一波
        if (currentWave.length > 0) {
            zombiesPerWave.push(currentWave);
        }

        // 计算关卡节奏和出怪强度
        const totalWaves = zombiesPerWave.length;
        let totalZombies = 0;
        const zombieTypesCount: { [key: string]: number } = {};

        zombiesPerWave.forEach(wave => {
            totalZombies += wave.length;
            wave.forEach(zombie => {
                if (zombie.Type in zombieTypesCount) {
                    zombieTypesCount[zombie.Type]++;
                } else {
                    zombieTypesCount[zombie.Type] = 1;
                }
            });
        });

        const rhythm = totalWaves > 10 ? '较慢' : totalWaves > 5 ? '适中' : '较快';
        const strength = totalZombies > 50 ? '高' : totalZombies > 20 ? '中' : '低';

        // 创建总结内容
        const summary = `
# 关卡总结

**初始阳光量**: ${json.Sun}
**背景编号**: ${json.Background}
**总波数**: ${totalWaves}
**节奏**: ${rhythm}
**出怪强度**: ${strength}

## 出怪表

| 波数 | 僵尸类型 | 行数 |
|------|----------|------|
${zombiesPerWave.map((wave, index) => {
            if (wave.length === 0) return `| ${index + 1} | - | - |\n`;
            return wave.map(zombie => `| ${index + 1} | ${zombie.Type} | ${zombie.Row} |`).join('\n');
        }).join('\n')}

## 僵尸统计

${Object.keys(zombieTypesCount).map(type => `- **${type}**: ${zombieTypesCount[type]} 次`).join('\n')}
        `;

        // 提示用户选择保存位置
        const saveUri = await vscode.window.showSaveDialog({
            filters: { 'Markdown Files': ['md'] },
            defaultUri: vscode.Uri.file(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : ''),
            saveLabel: 'Save Summary'
        });

        if (!saveUri) {
            return;
        }

        // 写入文件
        try {
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(summary, 'utf8'));
            vscode.window.showInformationMessage('关卡总结已生成。');
        } catch (error) {
            vscode.window.showErrorMessage('无法生成总结文件：' + error);
        }
    });

    context.subscriptions.push(generateSummaryCommand);
}

function validateDocument(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
    if (document.languageId !== 'json' || !document.uri.fsPath.includes('/levels/')) {
        return;
    }
  
    const text = document.getText();
    let json: any;
    const diagnostics: vscode.Diagnostic[] = [];
  
    try {
        json = JSON.parse(text);
    } catch (error: any) {
        const pattern = /at position (\d+)/;
        const match = error.message.match(pattern);
        if (match) {
            const pos = parseInt(match[1], 10);
            const position = document.positionAt(pos);
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(position, position),
                'JSON Syntax Error: ' + error.message,
                vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
        }
        collection.set(document.uri, diagnostics);
        return;
    }
  
    // 自定义规则示例：检查 "Row" 字段是否为整数
    if (json.ZombieList) {
        json.ZombieList.forEach((zombie: any, index: number) => {
            if (zombie.Row !== undefined && !Number.isInteger(zombie.Row)) {
                const line = getLineOfProperty(document, 'Row', index);
                if (line !== -1) {
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, 100)),
                        '"Row" must be an integer.',
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostics.push(diagnostic);
                }
            }
        });
    }
  
    collection.set(document.uri, diagnostics);
}

function getLineOfProperty(document: vscode.TextDocument, property: string, index: number): number {
    const regex = new RegExp(`"Type":\\s*"[^"]+",\\s*"${property}":\\s*[^,}]+`, 'g');
    let match;
    let currentIndex = 0;
    let lineNumber = -1;
  
    while ((match = regex.exec(document.getText())) !== null) {
        if (currentIndex === index) {
            const pos = document.positionAt(match.index);
            lineNumber = pos.line;
            break;
        }
        currentIndex++;
    }
  
    return lineNumber;
}

export function deactivate() {}
