import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import CardNavigation from "../components/card-navigation";
import ImagesCarousel from "../components/images-carousel";
import NavBar from "../components/navbar";
import { redirect } from "next/navigation";


export default async function Home() {

  const session = await auth.api.getSession({
    headers: await headers()
})

if(!session){
  redirect('/login');
}

  return (
    <div className="min-h-screen overflow-hidden relative">
        <main className="flex-1 px-4 py-10 flex flex-col gap-9">
          <ImagesCarousel 
            title="Bem-vindo ao Clube Xeque Mate de Iguatu"
            description="Seu espaço para interagir e praticar xadrez com seus amigos"
          />
          <CardNavigation
            image_url="/trophy.png"
            title="Torneios do clube"
            description="Participe dos torneios presenciais e online do clube, com emparelhamentos equilibrados e sistema de desempate próprio."
            navigate_to="/torneios"
          />
          <CardNavigation
            image_url="/goal.png"
            title="Exercícios práticos"
            description="Aqui você pode exercitar suas habilidades de todas as etapas de uma partida de xadrez, como táticas, aberturas e finais de jogo."
            navigate_to="/practice"
          />
        </main>
        <NavBar />
      </div>
  );
}
