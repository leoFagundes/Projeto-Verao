"use client";

import { Activity, Dumbbell, Link2, Ruler, Trophy, Users, Utensils } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type TabId = "perfis" | "treinos" | "vinculo" | "corridas" | "alimentacao" | "medidas" | "geral";

const TABS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: "perfis", label: "Perfis", icon: Users },
  { id: "treinos", label: "Treinos", icon: Dumbbell },
  { id: "vinculo", label: "Vínculo", icon: Link2 },
  { id: "corridas", label: "Corridas", icon: Activity },
  { id: "alimentacao", label: "Alimentação", icon: Utensils },
  { id: "medidas", label: "Medidas", icon: Ruler },
  { id: "geral", label: "Visão geral", icon: Trophy },
];

function H({ children }: { children: ReactNode }) {
  return <h3 className="font-semibold text-white">{children}</h3>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-slate-400">{children}</p>;
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-4 text-slate-400">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

const CONTENT: Record<TabId, ReactNode> = {
  perfis: (
    <div className="space-y-4">
      <P>
        O app é dividido em <strong className="text-slate-200">perfis</strong> — um para cada pessoa que treina. Na
        tela inicial, cada card é um perfil; basta tocar nele para entrar.
      </P>
      <div className="space-y-2">
        <H>Criar e administrar perfis</H>
        <P>
          Perfis são criados e gerenciados na área administrativa, aberta pelo ícone de engrenagem no canto superior
          direito da tela inicial. Ali dá para definir nome, foto, um tema de cores (muda o visual do app para essa
          pessoa) e uma senha opcional.
        </P>
      </div>
      <div className="space-y-2">
        <H>Senha do perfil</H>
        <P>
          Quando definida, a senha só é pedida para editar ou remover aquele perfil na área administrativa — não é
          necessária para entrar e treinar no dia a dia.
        </P>
      </div>
      <div className="space-y-2">
        <H>Receber treinos compartilhados</H>
        <P>
          É uma opção de cada perfil que, quando ligada, permite que outra pessoa registre um treino ou corrida
          também para o seu perfil ao concluir o dela (mais detalhes nas abas Treinos e Corridas).
        </P>
      </div>
      <div className="space-y-2">
        <H>Painel geral</H>
        <P>
          O ícone de troféu na tela inicial abre um resumo com todos os perfis lado a lado, incluindo uma comparação
          entre eles.
        </P>
      </div>
    </div>
  ),
  treinos: (
    <div className="space-y-4">
      <P>Cada perfil monta seus próprios planos de treino: um nome, uma categoria e uma lista de exercícios.</P>
      <div className="space-y-2">
        <H>Exercícios</H>
        <List
          items={[
            "Séries, e repetições ou tempo (útil para exercícios como prancha).",
            "Carga (peso) opcional — dá para desativar o controle de carga em exercícios que não usam peso.",
            "Tempo de descanso entre séries.",
            "Grupo muscular, imagens e vídeo de demonstração.",
            "Notas livres.",
          ]}
        />
        <P>
          Dois exercícios seguidos podem ser marcados como <strong className="text-slate-200">superserie</strong>,
          feitos em sequência sem descanso entre eles. Também dá para ocultar um exercício sem apagá-lo (ex.: uma
          lesão temporária) — ele some da lista principal mas continua salvo.
        </P>
      </div>
      <div className="space-y-2">
        <H>Realizar treino</H>
        <P>
          O botão &quot;Realizar treino&quot; abre um modo guiado: marca cada série como feita e ajusta carga, reps
          ou tempo reais daquela vez, com cronômetro de descanso opcional. O progresso é salvo automaticamente, então
          dá para fechar o app no meio e continuar depois de onde parou.
        </P>
        <P>
          Ao concluir, o treino vira uma sessão no histórico, entra nas estatísticas e gráficos de evolução, e pode
          desbloquear conquistas.
        </P>
      </div>
      <div className="space-y-2">
        <H>Compartilhar um treino realizado</H>
        <P>
          Ao concluir, também é possível compartilhar essa sessão com outro perfil que tenha &quot;Receber treinos
          compartilhados&quot; ligado. Essa pessoa ganha o mesmo registro no histórico dela, mesmo sem ter esse plano
          de treino montado — é diferente de vincular o plano em si (veja a aba Vínculo).
        </P>
      </div>
    </div>
  ),
  vinculo: (
    <div className="space-y-4">
      <P>
        Ao copiar um treino (botão &quot;Copiar&quot; na tela do treino) para outro perfil, você escolhe entre
        copiar <strong className="text-slate-200">vinculado</strong> ou <strong className="text-slate-200">solto</strong>.
      </P>
      <div className="space-y-2">
        <H>Cópia solta</H>
        <P>Vira um treino totalmente independente no outro perfil, sem nenhuma ligação com o original.</P>
      </div>
      <div className="space-y-2">
        <H>Cópia vinculada</H>
        <P>
          Os treinos ficam conectados formando um grupo. Se um treino vinculado for copiado (também vinculado) para
          um terceiro perfil, ele entra no mesmo grupo dos outros dois.
        </P>
      </div>
      <div className="space-y-2">
        <H>Quem manda no vínculo</H>
        <P>
          Só quem criou o treino originalmente — o <strong className="text-slate-200">dono</strong> — pode editar e
          sincronizar essa edição com todo o grupo vinculado. Isso vale mesmo que o treino já tenha passado por
          várias cópias: o dono é sempre quem criou o treino no início, não quem te passou a cópia diretamente. O
          nome de quem criou aparece na tela do treino, em &quot;Criado por&quot;.
        </P>
        <P>
          Quando o dono edita e salva, escolhe o que sincronizar: a lista de exercícios (quais são e em que ordem)
          sempre é enviada para todo o grupo; já carga, reps, descanso e notas de cada pessoa só são sincronizados se
          o dono marcar essas opções — senão cada um mantém o que já tinha ajustado na própria cópia.
        </P>
      </div>
      <div className="space-y-2">
        <H>Se alguém que não é o dono editar</H>
        <P>
          Quem não é o dono também pode editar a própria cópia vinculada — mas ao salvar, o app avisa antes: essa
          cópia vai perder o vínculo com o grupo (vira independente) e quem editou passa a ser a dona dela dali para
          frente. Isso existe justamente para proteger o treino original: ninguém além de quem criou consegue alterar
          o que as outras pessoas do grupo recebem.
        </P>
        <P>
          Um selo &quot;Cópia vinculada&quot; aparece na tela do treino sempre que você está vendo uma cópia que não
          é sua originalmente. Apagar sua cópia ou perder o vínculo não afeta as outras cópias, que continuam
          vinculadas entre si normalmente.
        </P>
      </div>
    </div>
  ),
  corridas: (
    <div className="space-y-4">
      <P>Cada corrida registrada guarda data, tipo (rua, esteira, trilha etc.), distância, duração e ritmo.</P>
      <List
        items={[
          "O ritmo é calculado automaticamente a partir da distância e da duração, mas pode ser editado na mão.",
          "A tela mostra estatísticas (distância total, ritmo médio, melhor ritmo) e um gráfico de evolução da distância ao longo do tempo.",
          "Dá para filtrar o histórico por tipo de corrida.",
        ]}
      />
      <P>
        Assim como um treino realizado, uma corrida registrada pode ser compartilhada com outro perfil que tenha
        &quot;Receber treinos compartilhados&quot; ligado.
      </P>
    </div>
  ),
  alimentacao: (
    <div className="space-y-4">
      <P>Cada perfil pode montar uma ou mais dietas: um plano de refeições para cada dia da semana.</P>
      <List
        items={[
          "Com uma dieta ativa, a tela mostra o checklist do dia — marque cada refeição como feita conforme come.",
          "Dá para marcar um dia inteiro como \"fugi da dieta\", com uma nota opcional explicando o que rolou.",
          "\"Ver semana\" mostra uma visão geral dos 7 dias de uma vez, com o que já foi feito e os dias fora da dieta.",
        ]}
      />
      <div className="space-y-2">
        <H>Reiniciar ou encerrar</H>
        <P>
          &quot;Reiniciar semana&quot; guarda a semana atual no histórico e começa um novo ciclo com a mesma dieta.
          &quot;Encerrar dieta&quot; também guarda a semana no histórico, mas nenhuma dieta fica ativa até você
          ativar outra.
        </P>
      </div>
    </div>
  ),
  medidas: (
    <div className="space-y-4">
      <P>
        Registros de medidas corporais: peso, percentual de gordura e outras medidas — o IMC é calculado
        automaticamente a partir do peso e da altura mais recentes.
      </P>
      <List
        items={[
          "Cada registro pode incluir fotos de progresso, reunidas numa linha do tempo.",
          "Dá para definir metas (ex.: chegar a um peso ou percentual de gordura específico) e acompanhar o progresso até elas.",
          "Um gráfico mostra a evolução de cada medida ao longo do tempo.",
          "O modo \"Comparar\" coloca dois ou mais registros lado a lado para ver a diferença entre eles.",
        ]}
      />
    </div>
  ),
  geral: (
    <div className="space-y-4">
      <div className="space-y-2">
        <H>Visão geral do perfil</H>
        <P>
          Reúne um resumo do perfil: calendário de atividade, consistência (sequência de dias treinando), volume de
          treino, corridas, foco por grupo muscular e atividade recente.
        </P>
      </div>
      <div className="space-y-2">
        <H>Conquistas</H>
        <P>
          São desbloqueadas automaticamente (recordes de carga, sequências de dias, marcos de distância etc.) e
          aparecem numa tela de celebração assim que acontecem, além de ficarem guardadas na Visão geral.
        </P>
      </div>
      <div className="space-y-2">
        <H>Painel geral</H>
        <P>
          O ícone de troféu na tela inicial abre um resumo com todos os perfis lado a lado e permite comparar dois ou
          mais entre si.
        </P>
      </div>
    </div>
  ),
};

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>("perfis");

  return (
    <Modal open={open} onClose={onClose} title="Como o app funciona">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "border-transparent text-slate-950"
                  : "border-[var(--border)] text-slate-300 hover:text-white",
              )}
              style={active ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" } : undefined}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-sm leading-relaxed">{CONTENT[tab]}</div>
    </Modal>
  );
}
