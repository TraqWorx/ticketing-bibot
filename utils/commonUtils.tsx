import { Link } from '@chakra-ui/react';
import { ReactNode } from 'react';

/**
 * Funzione per rendere cliccabili link ed email nel testo
 * Trasforma automaticamente URL ed email in componenti Link di Chakra UI
 *
 * @param text - Il testo da processare
 * @returns Array di elementi React con link cliccabili
 */
export const renderTextWithLinks = (text: string): ReactNode[] => {
    // TLD comuni per domini web validi
    const commonTLDs = ['com', 'org', 'net', 'it', 'de', 'uk', 'fr', 'es', 'io', 'co', 'edu', 'gov', 'info', 'biz', 'eu', 'us', 'ca', 'au', 'jp', 'cn', 'in', 'br', 'ru', 'nl', 'ch', 'se', 'no', 'dk', 'pl', 'at', 'be', 'cz', 'pt', 'gr', 'ro', 'hu', 'fi', 'ie', 'nz', 'za', 'mx', 'ar', 'cl'];
    
    // Estensioni di file comuni da escludere (non considerare link)
    const fileExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'zip', 'rar', '7z', 'tar', 'gz', 'txt', 'rtf', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'md', 'odt', 'ods', 'odp', 'pages', 'key', 'numbers'];

    // Regex separata per ogni tipo
    const urlWithProtocolRegex = /https?:\/\/[^\s]+/g;
    const urlWithWwwRegex = /www\.[^\s]+/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // Per domini nudi, richiedi almeno 2 caratteri prima del punto e verifica il TLD
    const nakedDomainRegex = /\b[a-zA-Z0-9][a-zA-Z0-9-]{1,}\.[a-zA-Z]{2,}\b/g;

    const matches = [];
    
    // Trova URL con protocollo
    let match: RegExpExecArray | null;
    while ((match = urlWithProtocolRegex.exec(text)) !== null) {
        matches.push({
            text: match[0],
            index: match.index,
            type: 'url'
        });
    }
    
    // Trova URL con www
    urlWithWwwRegex.lastIndex = 0;
    while ((match = urlWithWwwRegex.exec(text)) !== null) {
        matches.push({
            text: match[0],
            index: match.index,
            type: 'url'
        });
    }
    
    // Trova email
    emailRegex.lastIndex = 0;
    while ((match = emailRegex.exec(text)) !== null) {
        matches.push({
            text: match[0],
            index: match.index,
            type: 'email'
        });
    }
    
    // Trova domini nudi SOLO se hanno TLD validi
    nakedDomainRegex.lastIndex = 0;
    while ((match = nakedDomainRegex.exec(text)) !== null) {
        const matchText = match[0];
        const lowerMatch = matchText.toLowerCase();
        
        // Estrai il TLD
        const parts = lowerMatch.split('.');
        const tld = parts[parts.length - 1];
        
        // Salta se il TLD è un'estensione di file
        if (fileExtensions.includes(tld)) continue;
        
        // Accetta solo se il TLD è nella lista dei TLD comuni
        if (!commonTLDs.includes(tld)) continue;
        
        // Verifica che non sia già stato catturato da altre regex
        const alreadyMatched = matches.some(m => 
            match && m.index <= match.index && m.index + m.text.length >= match.index + matchText.length
        );
        if (alreadyMatched) continue;
        
        matches.push({
            text: matchText,
            index: match.index,
            type: 'url'
        });
    }

    // Ordina le corrispondenze dalla fine all'inizio per evitare problemi di offset
    matches.sort((a, b) => b.index - a.index);

    // Crea una copia del testo
    let result = text;

    // Sostituisci ciascuna corrispondenza dalla fine
    matches.forEach(({ text: matchText, type }) => {
        const replacement = type === 'email'
            ? `<email>${matchText}</email>`
            : `<url>${matchText}</url>`;
        result = result.replace(matchText, replacement);
    });

    // Ora dividi per i tag e rendi i componenti
    const parts = result.split(/(<email>.*?<\/email>|<url>.*?<\/url>)/);

    return parts.map((part, index): ReactNode => {
        if (part.startsWith('<email>') && part.endsWith('</email>')) {
            const email = part.slice(7, -8);
            return (
                <Link key={index} href={`mailto:${email}`} color="blue.500" textDecoration="underline">
                    {email}
                </Link>
            );
        } else if (part.startsWith('<url>') && part.endsWith('</url>')) {
            const url = part.slice(5, -6);
            let href = url;
            if (!href.startsWith('http://') && !href.startsWith('https://')) {
                href = `https://${href}`;
            }
            return (
                <Link key={index} href={href} target="_blank" rel="noopener noreferrer" color="blue.500" textDecoration="underline">
                    {url}
                </Link>
            );
        }
        return part as ReactNode;
    });
};