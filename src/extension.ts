import * as vscode from 'vscode';

const zombieTypeMap: { [key: string]: string } = {
    'NORMALZOMBIE': '普通僵尸',
    'FLAGZOMBIE': '旗帜僵尸',
    'CONEZOMBIE': '圆锥僵尸',
    'BUCKETZOMBIE': '铁桶僵尸',
    'POLEZOMBIE': '杆子僵尸',
    'FIREFLYZOMBIE': '萤火僵尸',
    'ARROWZOMBIE': '箭头僵尸',
    'WITCHZOMBIE': '女巫僵尸',
    'INFROLLZOMBIE': '滚轴僵尸',
    'MAGTRUCKZOMBIE': '磁力卡车僵尸',
    'HAMSTERZOMBIE': '仓鼠僵尸',
    'NULLZOMBIE': '空僵尸',
    'ENDNULLZOMBIE': '结束空僵尸'
};

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

    // 自动完成项提供者
    const provider = vscode.languages.registerCompletionItemProvider(
        { language: 'json', scheme: 'file', pattern: '**/levels/*.json' },
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('"Type": "')) {
                    return undefined;
                }

                return Object.entries(zombieTypeMap).map(([key, value]) => {
                    const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.Enum);
                    item.insertText = key; // 插入英文名称
                    return item;
                });
            }
        },
        '"' // 触发字符
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

        // 提示用户选择僵尸类型，显示中文名称
        const zombieTypeChinese = await vscode.window.showQuickPick(
            Object.values(zombieTypeMap),
            {
                placeHolder: '选择僵尸类型'
            }
        );

        if (!zombieTypeChinese) {
            return; // 用户取消
        }

        // 获取对应的英文名称
        const zombieType = Object.keys(zombieTypeMap).find(key => zombieTypeMap[key] === zombieTypeChinese);
        if (!zombieType) {
            vscode.window.showErrorMessage('选择的僵尸类型无效。');
            return;
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

        vscode.window.showInformationMessage(`已在第 ${wave} 波的第 ${row} 行插入 ${zombieTypeMap[zombieType] || zombieType}。`);
    });

    context.subscriptions.push(insertZombieCommand);

    // 其他命令同样进行类似的修改...

    // 生成总结命令示例已经在上面展示

    // 注册生成关卡总结命令
    const generateSummaryCommand = vscode.commands.registerCommand('ghtr-diy.generateSummary', async () => {
        // ...（参考上文的修改示例）
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
                'JSON 语法错误: ' + error.message,
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
                        '"Row" 必须是一个整数。',
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
