export class MarkdownConverter {
    static markdownToHtml(markdown) {
        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
            .replace(/\n/gim, '<br>');
    }

    static htmlToMarkdown(html) {
        return html
            .replace(/<h1>(.*?)<\/h1>/gim, '# $1')
            .replace(/<h2>(.*?)<\/h2>/gim, '## $1')
            .replace(/<h3>(.*?)<\/h3>/gim, '### $1')
            .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
            .replace(/<em>(.*?)<\/em>/gim, '*$1*')
            .replace(/<ul>(.*?)<\/ul>/gims, '$1')
            .replace(/<li>(.*?)<\/li>/gim, '* $1')
            .replace(/<br>/gim, '\n')
            .replace(/<\/?p>/gim, '');
    }

    static isTitleCase(str) {
        return str === str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }
}
