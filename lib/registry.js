export const CATEGORIES = {
    academic: 'Académique',
    navigation: 'Navigation',
    search: 'Recherche',
    system: 'Système',
    dev: 'Développeur',
    crud: 'Fichiers',
    tools: 'Outils',
};

export const COMMANDS = [
    {name: 'next', aliases: [], category: 'academic', description: 'Prochain cours, bus et devoirs', json: true, quick: true, placeholder: ''},
    {name: 'memo', aliases: ['devoirs', 'assign', 'hw'], category: 'academic', description: 'Devoirs / TP à rendre', json: true, quick: true, placeholder: 'list | add | next'},
    {name: 'timetable', aliases: ['edt', 'schedule'], category: 'academic', description: 'Emploi du temps GrSU', json: true, quick: true, placeholder: 'today | week | YYYY-MM-DD'},
    {name: 'transport', aliases: ['bus'], category: 'academic', description: 'Horaires des bus de Grodno', json: true, quick: false, placeholder: 'list | route | stop | next'},
    {name: 'place', aliases: [], category: 'academic', description: 'Lieux (groupes d’arrêts)', json: true, quick: false, placeholder: 'list | show | add'},
    {name: 'todo', aliases: ['todos'], category: 'academic', description: 'Todo personnelle', json: false, quick: true, placeholder: '[add]'},
    {name: 'study', aliases: [], category: 'academic', description: 'Suivi des devoirs/exercices', json: false, quick: false, placeholder: 'list | add | done'},
    {name: 'lab', aliases: [], category: 'academic', description: 'Initialiser un TP / labo', json: false, quick: false, placeholder: '<matiere> <numero> [titre]'},
    {name: 'doc', aliases: ['odt'], category: 'academic', description: 'Générer un document .odt', json: true, quick: false, placeholder: '<matiere> [titre]'},
    {name: 'translate', aliases: ['tr'], category: 'academic', description: 'Traduction FR ↔ RU', json: true, quick: false, placeholder: '<texte> to <langue>'},

    {name: 'open', aliases: [], category: 'navigation', description: 'Ouvrir un dossier clé', json: false, quick: true, placeholder: '<alias>'},
    {name: 'code', aliases: [], category: 'navigation', description: 'Ouvrir un projet dans VS Code', json: false, quick: true, placeholder: '<parent> <projet>'},
    {name: 'git-clone', aliases: [], category: 'navigation', description: 'Cloner un dépôt privé GitHub', json: false, quick: false, placeholder: '<nom_depot>'},

    {name: 'list', aliases: ['ls'], category: 'search', description: 'Vue d’ensemble du Bureau', json: false, quick: true, placeholder: '[projects|docs|scripts|recent]'},
    {name: 'find', aliases: ['search'], category: 'search', description: 'Recherche fichiers / dossiers', json: false, quick: false, placeholder: '<terme> [in <parent>]'},
    {name: 'grep', aliases: [], category: 'search', description: 'Recherche textuelle récursive', json: false, quick: false, placeholder: '<texte> [in <parent>]'},

    {name: 'sys', aliases: ['health'], category: 'system', description: 'Dashboard système', json: false, quick: true, placeholder: ''},
    {name: 'bat', aliases: ['battery', 'power'], category: 'system', description: 'État & santé de la batterie', json: false, quick: true, placeholder: ''},
    {name: 'vpn', aliases: [], category: 'system', description: 'État des tunnels VPN', json: false, quick: true, placeholder: '[status|start|stop]'},
    {name: 'ports', aliases: [], category: 'system', description: 'Ports TCP/UDP en écoute', json: false, quick: false, placeholder: '[kill <port>]'},
    {name: 'kill', aliases: ['pkill'], category: 'system', description: 'Arrêt sécurisé de processus', json: false, quick: false, placeholder: '<motif>', danger: true},

    {name: 'pulse', aliases: ['git-pulse'], category: 'dev', description: 'Radar Git du workspace', json: false, quick: true, placeholder: ''},
    {name: 'docker', aliases: [], category: 'dev', description: 'Conteneurs Docker', json: false, quick: false, placeholder: '[ps|logs|restart]'},
    {name: 'serve', aliases: ['http'], category: 'dev', description: 'Serveur HTTP local', json: false, quick: false, placeholder: '[port] [dossier]'},
    {name: 'backup', aliases: [], category: 'dev', description: 'Snapshot compressé', json: false, quick: false, placeholder: '<projet>'},
    {name: 'info', aliases: [], category: 'dev', description: 'Fiche technique d’un élément', json: false, quick: false, placeholder: '<cible>'},
    {name: 'phone', aliases: ['scrcpy', 'adb'], category: 'dev', description: 'ADB sans fil & scrcpy', json: false, quick: false, placeholder: '[connect <ip>]'},
    {name: 'ai', aliases: ['llm'], category: 'dev', description: 'Modèles LLM gratuits', json: false, quick: false, placeholder: 'free'},

    {name: 'mkdir', aliases: [], category: 'crud', description: 'Créer un dossier', json: false, quick: false, placeholder: '<nom> in <parent>'},
    {name: 'create', aliases: ['touch'], category: 'crud', description: 'Créer un fichier vide', json: false, quick: false, placeholder: '<fichier> in <parent>'},
    {name: 'edit', aliases: [], category: 'crud', description: 'Ouvrir dans nano', json: false, quick: false, placeholder: '<fichier>'},
    {name: 'mv', aliases: [], category: 'crud', description: 'Déplacer', json: false, quick: false, placeholder: '<source> in <destination>'},
    {name: 'rename', aliases: [], category: 'crud', description: 'Renommer', json: false, quick: false, placeholder: '<source> <nouveau_nom>'},
    {name: 'rm', aliases: ['delete', 'trash'], category: 'crud', description: 'Corbeille ~/.trash/ (jamais natif)', json: false, quick: false, placeholder: '<cible>', danger: true},
    {name: 'restore', aliases: [], category: 'crud', description: 'Restaurer depuis la corbeille', json: false, quick: false, placeholder: '[nom]'},

    {name: 'status', aliases: [], category: 'tools', description: 'État machine + dashboard (widget)', json: true, quick: true, placeholder: ''},
    {name: 'mount-drive', aliases: [], category: 'tools', description: 'Monter les disques configurés', json: false, quick: false, placeholder: ''},
    {name: 'godot', aliases: [], category: 'tools', description: 'Lancer Godot Engine', json: false, quick: false, placeholder: ''},
    {name: 'man', aliases: [], category: 'tools', description: 'Manuel d’un outil', json: false, quick: false, placeholder: '<outil>'},
    {name: 'help', aliases: [], category: 'tools', description: 'Aide complète', json: false, quick: false, placeholder: ''},
];

const BY_NAME = new Map();
for (const cmd of COMMANDS) {
    BY_NAME.set(cmd.name, cmd);
    for (const alias of cmd.aliases) {
        if (!BY_NAME.has(alias)) {
            BY_NAME.set(alias, cmd);
        }
    }
}

export function lookupCommand(word) {
    if (!word) {
        return null;
    }
    return BY_NAME.get(word.toLowerCase()) || null;
}

export function isKnownCommand(word) {
    return lookupCommand(word) !== null;
}

export function commandsByCategory(category) {
    return COMMANDS.filter((c) => c.category === category);
}

export function quickCommands() {
    return COMMANDS.filter((c) => c.quick);
}

export function suggestCommands(text, limit = 8) {
    const q = (text || '').trim().toLowerCase();
    if (!q) {
        return [];
    }
    const scored = [];
    for (const cmd of COMMANDS) {
        let score = -1;
        if (cmd.name === q) {
            score = 100;
        } else if (cmd.name.startsWith(q)) {
            score = 80 - cmd.name.length;
        } else if (cmd.name.includes(q)) {
            score = 50 - cmd.name.length;
        } else if (cmd.aliases.some((a) => a.startsWith(q))) {
            score = 40;
        }
        if (score >= 0) {
            scored.push({cmd, score});
        }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.cmd);
}
