import * as vscode from 'vscode';

// 僵尸类型的英文与中文映射
const ZombieTypeMap: { [key: string]: string } = {
    'NORMALZOMBIE': '普通僵尸',
    'FLAGZOMBIE': '旗帜僵尸',
    'CONEZOMBIE': '路障僵尸',
    'BUCKETZOMBIE': '持铁桶僵尸',
    'POLEZOMBIE': '撑杆僵尸',
    'FIREFLYZOMBIE': '萤火虫僵尸',
    'ARROWZOMBIE': '弓箭僵尸',
    'WITCHZOMBIE': '女巫僵尸',
    'INFROLLZOMBIE': '永动轮僵尸',
    'MAGTRUCKZOMBIE': '磁铁车僵尸',
    'HAMSTERZOMBIE': '仓鼠球僵尸',
    'NULLZOMBIE': '每波分隔符',
    'ENDNULLZOMBIE': '结束分隔符'
};

// 反向映射：中文到英文
const ZombieTypeReverseMap: { [key: string]: string } = Object.entries(ZombieTypeMap).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {} as { [key: string]: string });

// 基础的关卡评价标准（移除与出怪无关的评价）
const BaseLevelEvaluations: string[] = [
    '关卡节奏平衡良好',
    '僵尸种类丰富，挑战性高',
    '阳光分配合理，策略性强',
    '特殊僵尸出现频率适中',
    '背景与关卡主题契合',
    '波数设置合理，递进有序',
    '僵尸行进路线多样化',
    '关卡难度适中，适合大部分玩家',
    '无限阳光设置增加了关卡的策略深度',
    '僵尸出现速度适中，玩家有足够反应时间',
    '关卡布局合理，资源利用高效',
    '特殊僵尸的技能与普通僵尸形成对比',
    '关卡整体设计富有创意',
    '玩家有多种应对策略可选',
    '关卡目标明确，易于理解',
    '僵尸的强度递增合理',
    '关卡引导玩家逐步掌握游戏机制'
];

// 传送带相关的关卡评价
const ConveyorBeltEvaluations: string[] = [
    '传送带设置巧妙，增加了关卡的趣味性',
    '传送带上的特殊设置增加了游戏的复杂性'
];

// 其他参数映射
const AdditionalParamsMap: { [key: string]: string } = {
    "Sun": "初始阳光量",
    "Row": "行数",
    "BackgroundParam": "背景参数",
    "EndlessWave": "无尽循环波",
    "NoSeedChoose": "禁用选卡",
    "NoLawnPreview": "禁用预览出怪",
    "Mowers": "禁用小推车",
    "NoShovel": "隐藏铲子",
    "InftySun": "无限阳光",
    "Recorder": "记录器",
    "ExtraParam": "特殊属性",
    "Packets": "种子包内容",
    "Locks": "锁定植物"
};

/**
 * 自定义格式化JSON字符串，确保 ZombieList 中的每个僵尸对象在单独的一行。
 * @param jsonObj JSON对象
 * @returns 格式化后的JSON字符串
 */
function customFormatJSON(jsonObj: any): string {
    // 首先，格式化整个JSON对象
    let jsonString = JSON.stringify(jsonObj, null, 4);

    // 使用正则匹配 ZombieList 数组
    jsonString = jsonString.replace(/"ZombieList":\s*\[([\s\S]*?)\]/, (match, p1) => {
        // 匹配每个僵尸对象
        const zombies = p1.split(/},\s*{/).map((zombieStr: any) => {
            // 去除多余的空格和换行
            zombieStr = zombieStr.trim();
            // 确保每个僵尸对象以 { 开始，以 } 结尾
            if (!zombieStr.startsWith('{')) {
                zombieStr = `{${zombieStr}`;
            }
            if (!zombieStr.endsWith('}')) {
                zombieStr = `${zombieStr}}`;
            }
            // 压缩为单行
            return zombieStr.replace(/\s+/g, ' ');
        });

        // 重新构建 ZombieList
        const formattedZombies = zombies.map((z:any) => z).join(',\n        ');

        return `"ZombieList": [\n        ${formattedZombies}\n    ]`;
    });

    return jsonString;
}

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

    // 注册自动补全提供者
    const provider = vscode.languages.registerCompletionItemProvider(
        { language: 'json', scheme: 'file', pattern: '**\\levels\\*.json' },
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('"Type": "')) {
                    return undefined;
                }

                const types = Object.entries(ZombieTypeMap).map(([eng, chn]) => ({ label: chn, insertText: eng }));

                return types.map(type => {
                    const item = new vscode.CompletionItem(type.label, vscode.CompletionItemKind.Enum);
                    item.insertText = type.insertText;
                    return item;
                });
            }
        },
        '"' // trigger on "
    );

    context.subscriptions.push(provider);
	const formatJsonCommand = vscode.commands.registerCommand('ghtr-diy.formatJson', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('请打开一个 JSON 文件进行操作。');
			return;
		}
	
		const document = editor.document;
	
		// 确保在 levels/*.json 文件中
		if (document.languageId !== 'json' || !document.uri.fsPath.includes('\\levels\\')) {
			vscode.window.showErrorMessage('此命令仅适用于 levels/*.json 文件。');
			return;
		}
	
		const text = document.getText();
		let json: any;
		try {
			json = JSON.parse(text);
		} catch (error) {
			vscode.window.showErrorMessage('JSON 解析错误，无法格式化。');
			return;
		}
	
		// 使用之前定义的 customFormatJSON 函数
		const formattedJson = customFormatJSON(json);
	
		// 应用格式化后的 JSON
		await editor.edit(editBuilder => {
			editBuilder.replace(
				new vscode.Range(
					document.positionAt(0),
					document.positionAt(text.length)
				),
				formattedJson
			);
		});
	
		vscode.window.showInformationMessage('JSON 格式化完成。');
	});
	context.subscriptions.push(formatJsonCommand);
    // 注册插入僵尸命令
    const insertZombieCommand = vscode.commands.registerCommand('ghtr-diy.insertZombie', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('请打开一个JSON文件进行操作。');
            return;
        }

        const document = editor.document;

        // 仅在 JSON 文件中工作，且路径包含 \\levels\\
        if (document.languageId !== 'json' || !document.uri.fsPath.includes('\\levels\\')) {
            vscode.window.showErrorMessage('此命令仅适用于 levels/*.json 文件。');
            return;
        }

        // 提示用户选择僵尸类型（显示中文）
        const zombieTypeChn = await vscode.window.showQuickPick(
            Object.values(ZombieTypeMap),
            {
                placeHolder: '选择僵尸类型'
            }
        );

        if (!zombieTypeChn) {
            return; // 用户取消
        }

        const zombieType = ZombieTypeReverseMap[zombieTypeChn];
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

            // 设置默认值
            if (json.Sun === undefined) {
                json.Sun = 50;
            }
            if (json.Background === undefined) {
                json.Background = 0;
            }

            if (!json.ZombieList || !Array.isArray(json.ZombieList)) {
                vscode.window.showErrorMessage('ZombieList 不存在或格式不正确。');
                return;
            }

            // 确定波数的起始位置
            const zombiesPerWave: any[][] = [];
            let currentWave: any[] = [];

            json.ZombieList.forEach((zombie: any) => {
                if (zombie.Type === 'NULLZOMBIE' || zombie.Type === 'ENDNULLZOMBIE') {
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
            }

            // 获取指定波的僵尸列表
            const targetWaveIndex = wave - 1;
            let targetWave = zombiesPerWave[targetWaveIndex];

            // 创建新的僵尸对象
            const newZombie: any = { Type: zombieType, Row: row };

            // 插入到目标波
            targetWave.push(newZombie);

            // 重新构建 ZombieList
            const newZombieList: any[] = [];
            zombiesPerWave.forEach((waveZombies, index) => {
                if (waveZombies.length > 0) {
                    // 格式化每个僵尸对象为单行
                    waveZombies.forEach(z => {
                        newZombieList.push({ ...z });
                    });
                }
                // 在波与波之间添加 NULLZOMBIE，除非是最后一波
                if (index < zombiesPerWave.length - 1) {
                    newZombieList.push({ Type: 'NULLZOMBIE', Row: 0 });
                }
            });

            // 检查是否存在 ENDNULLZOMBIE，如果存在，则插入新的僵尸到其前面
            const endNullIndex = newZombieList.findIndex(z => z.Type === 'ENDNULLZOMBIE');
            if (endNullIndex !== -1) {
                newZombieList.splice(endNullIndex, 0, newZombie);
            }

            // 更新 JSON 对象
            json.ZombieList = newZombieList;

            // 使用自定义格式化函数
            const newText = customFormatJSON(json);

            // 替换整个文档内容
            editBuilder.replace(new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            ), newText);
        });

        vscode.window.showInformationMessage(`已在第 ${wave} 波的第 ${row} 行插入 ${ZombieTypeMap[zombieType]}。`);
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

        // 仅在 JSON 文件中工作，且路径包含 \\levels\\
        if (document.languageId !== 'json' || !document.uri.fsPath.includes('\\levels\\')) {
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

            // 设置默认值
            if (json.Sun === undefined) {
                json.Sun = 50;
            }
            if (json.Background === undefined) {
                json.Background = 0;
            }

            if (!json.ZombieList || !Array.isArray(json.ZombieList)) {
                vscode.window.showErrorMessage('ZombieList 不存在或格式不正确。');
                return;
            }

            // 确定波数的起始位置
            const zombiesPerWave: any[][] = [];
            let currentWave: any[] = [];

            json.ZombieList.forEach((zombie: any) => {
                if (zombie.Type === 'NULLZOMBIE' || zombie.Type === 'ENDNULLZOMBIE') {
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
            zombiesPerWave.forEach((waveZombies, index) => {
                if (waveZombies.length > 0) {
                    // 格式化每个僵尸对象为单行
                    waveZombies.forEach(z => {
                        newZombieList.push({ ...z });
                    });
                }
                // 在波与波之间添加 NULLZOMBIE，除非是最后一波
                if (index < zombiesPerWave.length - 1) {
                    newZombieList.push({ Type: 'NULLZOMBIE', Row: 0 });
                }
            });

            // 更新 JSON 对象
            json.ZombieList = newZombieList;

            // 使用自定义格式化函数
            const newText = customFormatJSON(json);

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

        // 仅在 JSON 文件中工作，且路径包含 \\levels\\
        if (document.languageId !== 'json' || !document.uri.fsPath.includes('\\levels\\')) {
            vscode.window.showErrorMessage('此命令仅适用于 levels/*.json 文件。');
            return;
        }

        // 确认操作
        const confirm = await vscode.window.showWarningMessage('确定要清空所有波数的所有僵尸吗？此操作不可撤销。', { modal: true }, '是');

        if (confirm !== '是') {
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

            // 设置默认值
            if (json.Sun === undefined) {
                json.Sun = 50;
            }
            if (json.Background === undefined) {
                json.Background = 0;
            }

            if (!json.ZombieList || !Array.isArray(json.ZombieList)) {
                vscode.window.showErrorMessage('ZombieList 不存在或格式不正确。');
                return;
            }

            // 清空所有波数的僵尸
            json.ZombieList = [];

            // 使用自定义格式化函数
            const newText = customFormatJSON(json);

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
            prompt: '输入初始阳光量 (整数, 默认50)',
            validateInput: (value) => {
                if (value.trim() === '') return null; // 允许为空，使用默认值
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 0) {
                    return '请输入一个有效的非负整数。';
                }
                return null;
            }
        });

        let sun: number = 50; // 默认值
        if (sunInput && sunInput.trim() !== '') {
            sun = parseInt(sunInput, 10);
        }

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
            prompt: '输入背景编号 (整数, 默认0)',
            validateInput: (value) => {
                if (value.trim() === '') return null; // 允许为空，使用默认值
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 0) {
                    return '请输入一个有效的非负整数。';
                }
                return null;
            }
        });

        let background: number = 0; // 默认值
        if (backgroundInput && backgroundInput.trim() !== '') {
            background = parseInt(backgroundInput, 10);
        }

        // 创建模板对象，包含额外参数
        const template: any = {
            Sun: sun,
            Waves: waves,
            Background: background,
            ZombieList: []
        };

        // 添加额外参数的默认值
        template.EndlessWave = 0;
        template.NoSeedChoose = false;
        template.NoLawnPreview = false;
        template.Mowers = false;
        template.NoShovel = false;
        template.InftySun = false;
        template.Recorder = 0;
        template.ExtraParam = 0;
        template.Packets = [];
        template.Locks = [];

        // 使用自定义格式化函数
        const templateText = customFormatJSON(template);

        // 提示用户选择保存位置
        const saveUri = await vscode.window.showSaveDialog({
            filters: { 'JSON Files': ['json'] },
            defaultUri: vscode.Uri.file(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : ''),
            saveLabel: '保存模板'
        });

        if (!saveUri) {
            return;
        }

        // 写入文件
        try {
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(templateText, 'utf8'));
            vscode.window.showInformationMessage('DIY 模板示例文件已创建。');
        } catch (error: any) {
            vscode.window.showErrorMessage('无法创建模板文件：' + error.message);
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

        // 仅在 JSON 文件中工作，且路径包含 \\levels\\
        if (document.languageId !== 'json' || !document.uri.fsPath.includes('\\levels\\')) {
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

        // 设置默认值
        if (json.Sun === undefined) {
            json.Sun = 50;
        }
        if (json.Background === undefined) {
            json.Background = 0;
        }

        if (!json.ZombieList || !Array.isArray(json.ZombieList)) {
            vscode.window.showErrorMessage('ZombieList 不存在或格式不正确。');
            return;
        }

        // 生成出怪表
        const zombiesPerWave: any[][] = [];
        let currentWave: any[] = [];

        json.ZombieList.forEach((zombie: any) => {
            if (zombie.Type === 'NULLZOMBIE' || zombie.Type === 'ENDNULLZOMBIE') {
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

        // 检查是否存在传送带
        const hasConveyorBelt = !!json.ConveyorBelt;

        // 根据是否存在传送带，动态设置 LevelEvaluations
        let dynamicLevelEvaluations = [...BaseLevelEvaluations];
        if (hasConveyorBelt) {
            dynamicLevelEvaluations = dynamicLevelEvaluations.concat(ConveyorBeltEvaluations);
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

        // 生成每一波的具体评价
        const waveEvaluations: string[] = [];
        zombiesPerWave.forEach((wave, index) => {
            const evalIndex = index % dynamicLevelEvaluations.length;
            waveEvaluations.push(dynamicLevelEvaluations[evalIndex]);
        });

        // 创建总结内容
        let summary = `
# 关卡总结

**初始阳光量**: ${json.Sun}
**背景编号**: ${json.Background}
**总波数**: ${totalWaves}
**节奏**: ${rhythm}
**出怪强度**: ${strength}
`;

        // 包含额外参数
        Object.keys(AdditionalParamsMap).forEach(param => {
            if (json[param] !== undefined && param !== 'Sun' && param !== 'Row' && param !== 'Packets' && param !== 'Locks') {
                const displayName = AdditionalParamsMap[param];
                const value = json[param];
                summary += `**${displayName}**: ${value}\n`;
            }
        });

        // 传送带设置（条件性显示）
        if (hasConveyorBelt) {
            summary += `
## 传送带设置
- **初始时间**: ${json.ConveyorBelt.InitTime} 毫秒
- **间隔时间**: ${json.ConveyorBelt.Interval} 毫秒
- **包裹内容**:
`;
            json.ConveyorBelt.Packets.forEach((packet: any, idx: number) => {
                summary += `  ${idx + 1}. 类型: ${packet.Type}, 最小重量: ${packet.MinWeight || 'N/A'}, 最小重量数量: ${packet.MinWeightNum || 'N/A'}, 总数: ${packet.Total || 'N/A'}\n`;
            });
        }

        // 生成出怪表
        summary += `
## 出怪表

| 波数 | 僵尸类型 | 行数 |
|------|----------|------|
`;

        zombiesPerWave.forEach((wave, index) => {
            if (wave.length === 0) {
                summary += `| ${index + 1} | - | - |\n`;
            } else {
                wave.forEach(zombie => {
                    const rowDisplay = zombie.Row !== undefined ? zombie.Row : '';
                    summary += `| ${index + 1} | ${ZombieTypeMap[zombie.Type] || zombie.Type} | ${rowDisplay} |\n`;
                });
            }
        });

        // 列出每波的评价
        summary += `
## 每波评价

`;

        zombiesPerWave.forEach((wave, index) => {
            summary += `- **第 ${index + 1} 波**: ${waveEvaluations[index]}\n`;
        });

        // 僵尸统计
        summary += `
## 僵尸统计

${Object.keys(zombieTypesCount)
    .filter(type => type !== 'ENDNULLZOMBIE') // 排除 ENDNULLZOMBIE
    .map(type => `- **${ZombieTypeMap[type] || type}**: ${zombieTypesCount[type]} 次`)
    .join('\n')}
`;

        // 提示用户选择保存位置
        const saveUri = await vscode.window.showSaveDialog({
            filters: { 'Markdown Files': ['md'] },
            defaultUri: vscode.Uri.file(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : ''),
            saveLabel: '保存总结'
        });

        if (!saveUri) {
            return;
        }

        // 写入文件
        try {
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(summary.trim(), 'utf8'));
            vscode.window.showInformationMessage('关卡总结已生成。');
        } catch (error: any) {
            vscode.window.showErrorMessage('无法生成总结文件：' + error.message);
        }
    });

    context.subscriptions.push(generateSummaryCommand);
}

// 自定义验证文档
function validateDocument(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
    if (document.languageId !== 'json' || !document.uri.fsPath.includes('\\levels\\')) {
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
                        '"Row" 必须是整数。',
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostics.push(diagnostic);
                }
            }

            // 检查僵尸类型是否有效
            if (zombie.Type && !(zombie.Type in ZombieTypeMap)) {
                const line = getLineOfProperty(document, 'Type', index);
                if (line !== -1) {
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line, 100)),
                        `"Type" 的值无效: ${zombie.Type}`,
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
    const regex = new RegExp(`"${property}":\\s*[^,}]+`, 'g');
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
