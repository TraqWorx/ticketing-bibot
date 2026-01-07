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
    // Regex più selettiva: solo URL con protocollo, www, o email
    const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

    // Trova tutte le corrispondenze con le loro posizioni
    const matches = [];
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
        matches.push({
            text: match[0],
            index: match.index,
            type: match[0].includes('@') ? 'email' : 'url'
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