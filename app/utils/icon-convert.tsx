import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
    iconName: string;
}

export default function DynamicIcon({ iconName }: Props) {
    const Icon = (Icons as unknown as Record<string, LucideIcon | undefined>)[iconName];

    if (!Icon) return <p>Icone não encontrado</p>;

    return <Icon size={24} />;
}
