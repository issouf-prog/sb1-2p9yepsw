"use client";

import { useState } from "react";
import {
  Plus, MousePointer2, BoxSelect, Type, LayoutGrid, Images, FileText, Clapperboard, Settings, Bell,
  Upload, StickyNote, Image as ImageIcon, Video, Mic, Music, RefreshCw, Star, FolderInput, Film, Box,
} from "lucide-react";
import tokens from "../../../../replica/design/tokens.json";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Chip } from "@/components/ui/chip";
import { NavTabs } from "@/components/ui/nav-tabs";
import { Segmented } from "@/components/ui/segmented";
import { CreditBadge, Avatar } from "@/components/ui/credit-badge";
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator, MenuSub, MenuSubTrigger, MenuSubContent } from "@/components/ui/menu";
import { Dialog } from "@/components/ui/dialog";
import { PromptBox } from "@/components/ui/prompt-box";
import { ProjectCard, FilmCard } from "@/components/ui/cards";
import { ActionCard, AssetChip, UserMessage, AgentMessage, TopUpButton } from "@/components/ui/agent";
import { VerticalToolbar, ToolbarDivider, SectionHeader, MediaNode } from "@/components/ui/canvas-bits";

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-border py-10">
      <h2 id={id} className="mb-6 text-nav uppercase text-text-muted">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  const [tab, setTab] = useState("home");
  const [ptab, setPtab] = useState("canvas");
  const [mode, setMode] = useState<"scene" | "cameras">("scene");
  const [dim, setDim] = useState<"3d" | "2d">("3d");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider>
      <main className="mx-auto max-w-[var(--size-content-max)] px-6 pb-24">
        <header className="py-10">
          <h1 className="text-display">Système de design</h1>
          <p className="mt-2 text-lg text-text-muted">Tokens et composants de base. Les couleurs sont des placeholders jusqu&apos;à /replica-brand.</p>
        </header>

        <Block id="couleurs" title="Couleurs (rôles)">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {Object.entries(tokens.color).map(([name, hex]) => (
              <li key={name} className="border border-border bg-surface">
                <div className="h-16" style={{ background: hex }} />
                <p className="px-3 pt-2 text-sm">{name}</p>
                <p className="px-3 pb-2 text-xs tabular-nums text-text-muted">{hex}</p>
              </li>
            ))}
          </ul>
        </Block>

        <Block id="typo" title="Typographie">
          <div className="space-y-3">
            <p className="text-display">Quelle histoire racontons-nous ?</p>
            <p className="text-2xl">Titre de section 28</p>
            <p className="text-xl">Titre de carte 22</p>
            <p className="text-lg">Texte du chat 18 — l&apos;agent répond ici.</p>
            <p className="text-base">Texte courant 16</p>
            <p className="text-sm text-text-muted">Texte secondaire 14</p>
            <p className="text-xs text-text-muted">Légende 12</p>
            <p className="text-nav uppercase">Navigation 15 capitales</p>
          </div>
        </Block>

        <Block id="nav" title="Barres de navigation">
          <div className="flex h-[var(--size-header)] items-center justify-between border-b border-border bg-surface px-5">
            <span className="text-xl font-medium">Studio</span>
            <NavTabs label="Navigation principale" active={tab} onChange={setTab} tabs={[
              { id: "home", label: "Accueil" }, { id: "work", label: "Projets" }, { id: "tv", label: "Galerie" }, { id: "ref", label: "Références" },
            ]} />
            <div className="flex items-center gap-3">
              <IconButton label="Notifications" icon={<Bell className="size-5" />} />
              <Button size="md"><Plus aria-hidden className="size-4" />Créer</Button>
              <CreditBadge balance={125} />
              <Avatar name="Viralix" />
            </div>
          </div>
          <div className="mt-6 flex h-[var(--size-project-header)] items-center justify-center border-b border-border bg-surface">
            <NavTabs label="Vues du projet" active={ptab} onChange={setPtab} tabs={[
              { id: "story", label: "Histoire" }, { id: "canvas", label: "Toile" }, { id: "stage", label: "Plateau 3D" }, { id: "editor", label: "Montage" },
            ]} />
          </div>
        </Block>

        <Block id="boutons" title="Boutons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Principal</Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="ghost">Discret</Button>
            <Button variant="danger">Supprimer</Button>
            <Button loading>Génération…</Button>
            <Button disabled>Désactivé</Button>
            <Button cost={30}>Lancer</Button>
            <Button locked cost={320}>Lancer</Button>
            <Button size="sm">Petit</Button>
            <Button size="lg">Grand</Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Chip>Du scénario au film</Chip>
            <Chip>Du prompt au film</Chip>
            <Chip>Créer des personnages</Chip>
            <Chip>Partir d&apos;un style</Chip>
            <Chip>Toile vide</Chip>
            <Chip>Découvrir</Chip>
            <Chip size="sm">Vérifier la continuité d&apos;abord</Chip>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <Segmented label="Vue du plateau" value={mode} onChange={setMode} options={[{ value: "scene", label: "Scène" }, { value: "cameras", label: "Caméras" }]} />
            <Segmented label="Dimension" value={dim} onChange={setDim} options={[{ value: "3d", label: "3D" }, { value: "2d", label: "2D" }]} />
          </div>
        </Block>

        <Block id="prompt" title="Boîte de prompt (accueil)">
          <PromptBox placeholder="Un conte pour enfants sur une petite renarde courageuse…" />
        </Block>

        <Block id="menus" title="Menus et modale">
          <div className="flex flex-wrap gap-4">
            <Menu>
              <MenuTrigger asChild><Button variant="secondary"><Plus aria-hidden className="size-4" />Ajouter</Button></MenuTrigger>
              <MenuContent>
                <MenuItem icon={<Upload />}>Importer un fichier</MenuItem>
                <MenuItem icon={<StickyNote />}>Note</MenuItem>
                <MenuItem icon={<ImageIcon />}>Image</MenuItem>
                <MenuSub>
                  <MenuSubTrigger icon={<Video />}>Vidéo</MenuSubTrigger>
                  <MenuSubContent>
                    <MenuItem>Depuis une image</MenuItem>
                    <MenuItem>Avec des références</MenuItem>
                  </MenuSubContent>
                </MenuSub>
                <MenuItem icon={<Mic />}>Voix</MenuItem>
                <MenuItem icon={<Music />}>Musique</MenuItem>
              </MenuContent>
            </Menu>
            <Menu>
              <MenuTrigger asChild><Button variant="secondary">Menu d&apos;un nœud</Button></MenuTrigger>
              <MenuContent>
                <MenuItem icon={<RefreshCw />}>Relancer</MenuItem>
                <MenuSeparator />
                <MenuSub><MenuSubTrigger icon={<ImageIcon />}>Image</MenuSubTrigger><MenuSubContent><MenuItem>Modifier</MenuItem><MenuItem>Personnage de référence</MenuItem><MenuItem>Retirer le fond</MenuItem></MenuSubContent></MenuSub>
                <MenuSub><MenuSubTrigger icon={<Video />}>Vidéo</MenuSubTrigger><MenuSubContent><MenuItem>Animer cette image</MenuItem></MenuSubContent></MenuSub>
                <MenuSub><MenuSubTrigger icon={<Music />}>Audio</MenuSubTrigger><MenuSubContent><MenuItem>Donner une voix</MenuItem></MenuSubContent></MenuSub>
                <MenuItem icon={<Star />}>Garder comme style</MenuItem>
                <MenuSeparator />
                <MenuItem icon={<FolderInput />}>Ranger dans un dossier</MenuItem>
                <MenuItem icon={<Film />}>Envoyer au montage</MenuItem>
                <MenuItem icon={<Box />}>Ouvrir en 3D</MenuItem>
              </MenuContent>
            </Menu>
            <Dialog title="Plus assez de crédits" description="Ce lot coûte 640 crédits, il vous en reste 125. Rien n'a été lancé."
              trigger={<Button variant="secondary">Ouvrir la modale</Button>}>
              <div className="flex justify-end gap-2"><Button variant="ghost">Plus tard</Button><Button>Recharger</Button></div>
            </Dialog>
          </div>
        </Block>

        <Block id="cartes" title="Cartes">
          <div className="flex flex-wrap gap-6"><ProjectCard title="Le jardin de nuit — série verticale" updatedAt="17 oct. 2026" /></div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FilmCard title="Les marées rouges" creator="Awa Diallo" duration="04:12" remixes={212} likes={64} tips={2800} />
            <FilmCard title="Station 9" creator="Léo Martin" duration="10:03" remixes={98} likes={41} tips={1200} />
            <FilmCard title="Papier" creator="Inès K." duration="01:58" remixes={12} likes={9} tips={150} />
          </div>
        </Block>

        <Block id="agent" title="Agent">
          <div className="max-w-[var(--size-agent-panel)] space-y-5 border border-border bg-surface p-5">
            <Chip size="sm">Vérifier la continuité d&apos;abord</Chip>
            <UserMessage>Lance les deux séquences</UserMessage>
            <ActionCard label="Lire le montage" status="done" />
            <ActionCard label="Lancer 2 vidéos" status="running" />
            <ActionCard label="Lancer 2 vidéos" status="failed"
              detail="Il manque 515 crédits pour ce lot (640 nécessaires, 125 disponibles). Rien n'a été lancé ni débité."
              action={<TopUpButton />} />
            <AgentMessage>
              J&apos;ai ajouté <AssetChip kind="video" label="Séquence 1 — le jardin" /> au montage, de 0:00 à 0:15.
              La <AssetChip kind="image" label="Plan de raccord" /> attend des crédits.
            </AgentMessage>
          </div>
        </Block>

        <Block id="toile" title="Toile">
          <div className="flex gap-10 bg-canvas p-8">
            <VerticalToolbar zoom={43}>
              <IconButton tone="solid" label="Ajouter" icon={<Plus className="size-5" />} />
              <IconButton label="Sélection" shortcut="V" active icon={<MousePointer2 className="size-5" />} />
              <IconButton label="Section" shortcut="S" icon={<BoxSelect className="size-5" />} />
              <IconButton label="Texte" shortcut="T" icon={<Type className="size-5" />} />
              <IconButton label="Disposition" icon={<LayoutGrid className="size-5" />} />
              <ToolbarDivider />
              <IconButton label="Ressources" icon={<Images className="size-5" />} />
              <IconButton label="Histoire" icon={<FileText className="size-5" />} />
              <IconButton label="Montage" icon={<Clapperboard className="size-5" />} />
              <ToolbarDivider />
              <IconButton label="Réglages" icon={<Settings className="size-5" />} />
            </VerticalToolbar>
            <div className="space-y-4">
              <SectionHeader name="Le jardin de nuit · terrasse" collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
              {!collapsed && (
                <div className="flex gap-8 bg-section p-6">
                  <MediaNode title="Plan de raccord — milieu de la séquence" width={864} height={1536}
                    prompt="Une image de raccord pour le milieu de la même vidéo verticale, lumière de guirlandes, plan moyen, les deux personnages accroupis près de la petite voiture." />
                  <MediaNode selected={false} title="Plan large" width={864} height={1536} prompt="Plan large de la terrasse au crépuscule." />
                </div>
              )}
            </div>
          </div>
        </Block>
      </main>
    </TooltipProvider>
  );
}
