import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface IslamicContent {
    text: string;
    source: string;
    reference?: string;
}

interface ConfigurationChangeEvent {
    affectsConfiguration(section: string): boolean;
}

export function activate(context: vscode.ExtensionContext) {
    let interval: ReturnType<typeof setInterval> | undefined;

    // Function to read content from JSON files
    function readContentFile(fileName: string): IslamicContent[] {
        try {
            const filePath = path.join(context.extensionPath, 'src', 'content', fileName);
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error(`Error reading ${fileName}:`, error);
            return [];
        }
    }

    async function getRandomHadith() {
        const hadiths = readContentFile('hadiths.json');
        if (hadiths.length === 0) {
            return '❌ تعذر قراءة الأحاديث';
        }
        const randomIndex = Math.floor(Math.random() * hadiths.length);
        const hadith = hadiths[randomIndex];
        return `📖 حديث شريف:\n${hadith.text}\n\nالمصدر: ${hadith.source}${hadith.reference ? `\nالرقم: ${hadith.reference}` : ''}`;
    }

    async function showNotification() {
        const config = vscode.workspace.getConfiguration('islamicReminders');
        let message = '';

        if (config.get('enableHadith')) {
            message = await getRandomHadith();
        }

        vscode.window.showInformationMessage(message);
    }

    function startReminders() {
        const config = vscode.workspace.getConfiguration('islamicReminders');
        const intervalMinutes = config.get('interval', 60);
        
        if (interval) {
            clearInterval(interval);
        }

        // Show initial notification
        showNotification();

        // Set up periodic notifications
        interval = setInterval(showNotification, intervalMinutes * 60 * 1000);
    }

    // Start reminders when extension activates
    startReminders();

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e: ConfigurationChangeEvent) => {
            if (e.affectsConfiguration('islamicReminders')) {
                startReminders();
            }
        })
    );

    // Add command to manually trigger notification
    let disposable = vscode.commands.registerCommand('islamic-reminders.showNow', () => {
        showNotification();
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
    // Cleanup will be handled automatically
} 