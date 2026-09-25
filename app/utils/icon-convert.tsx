import * as Icons from "lucide-react";

interface Props {
    iconName: string;
}

export default function DynamicIcon({ iconName }: Props) {
    const Icon = (Icons as any)[iconName]; // pega o ícone pela string

    if (!Icon) return <p>Icone não encontrado</p>;

    return <Icon size={24} />;
}
