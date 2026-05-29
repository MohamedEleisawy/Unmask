export function LandingHowItWorks() {
  return (
    <section id="how" className="w-full max-w-[1200px] mx-auto px-4 md:px-10 pb-24">

      <h2 className="font-landing-body font-medium text-[#dcdcdc] text-[24px] md:text-[36px] mb-10 md:mb-14">
        Comment ça fonctionne ?
      </h2>

      <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:gap-6">
        <StepCard
          label="Recherche"
          bg="#fec530"
          textColor="#100400"
          vectorSrc="/landing/vector-recherche.svg"
          badgeVectorStyle={{ left: "-7.02%", right: "47.05%", top: "calc(50% + 4.49px)", height: "68.36px" }}
          cardVectorStyle={{ top: "-10px", left: "-20px", width: "140px", height: "140px", opacity: 0.12 }}
          description="Entrez le nom d'un influenceur, coach ou vendeur en ligne."
          labelOffsetX="calc(50% - 40px)"
        />
        <StepCard
          label="Collecte"
          bg="#0cdda5"
          textColor="#100400"
          vectorSrc="/landing/vector-collecte.svg"
          badgeVectorStyle={{ left: "-7.02%", right: "50%", top: "calc(50% + 14.81px)", height: "65px" }}
          cardVectorStyle={{ top: "-20px", left: "-20px", width: "140px", height: "140px", opacity: 0.12 }}
          description="Articles, réseaux sociaux, sites d'entreprises, bases publiques, contenus associés."
          labelOffsetX="calc(50% - 31px)"
        />
        <StepCard
          label="Structuration"
          bg="#936bff"
          textColor="#fff3e1"
          vectorSrc="/landing/vector-structuration.svg"
          badgeVectorStyle={{ left: "-37.97%", right: "41.37%", top: "calc(50% - 5.46px)", height: "110.127px" }}
          cardVectorStyle={{ top: "-15px", left: "-25px", width: "150px", height: "150px", opacity: 0.2 }}
          description="On regroupe ce qui concerne son activité : business, promesses, collaborations, signalements éventuels."
          labelOffsetX="calc(50% - 48px)"
        />
        <StepCard
          label="Lecture"
          bg="#f84b5f"
          textColor="#fff3e1"
          vectorSrc="/landing/vector-lecture.svg"
          badgeVectorStyle={{ left: "-10.99%", right: "52.6%", top: "calc(50% + 11.97px)", height: "74.957px" }}
          cardVectorStyle={{ top: "-10px", left: "-15px", width: "120px", height: "140px", opacity: 0.12 }}
          description="Vous accédez à une vue structurée des informations disponibles, pour vous faire votre propre avis."
          labelOffsetX="calc(50% - 28px)"
        />
      </div>
    </section>
  );
}

type StepCardProps = {
  label: string;
  bg: string;
  textColor: string;
  vectorSrc: string;
  badgeVectorStyle: React.CSSProperties;
  cardVectorStyle: React.CSSProperties;
  description: string;
  labelOffsetX: string;
};

function StepCard({ label, bg, textColor, vectorSrc, badgeVectorStyle, cardVectorStyle, description, labelOffsetX }: StepCardProps) {
  return (
    <div className="flex items-start gap-5 md:relative md:flex-col md:gap-5 md:bg-[#161616] md:rounded-2xl md:border md:border-white/[0.06] md:p-6 md:hover:border-white/[0.12] md:overflow-hidden transition-colors">

      {/* Décor en background de la carte — desktop uniquement */}
      <img
        alt=""
        src={vectorSrc}
        className="hidden md:block absolute pointer-events-none select-none"
        style={{ ...cardVectorStyle, position: "absolute" }}
      />

      {/* Badge — même rendu mobile et desktop */}
      <div className="shrink-0 relative" style={{ width: 114, height: 44 }}>
        <div
          className="absolute inset-0 overflow-clip"
          style={{ backgroundColor: bg, borderRadius: "32px 32px 12px 32px" }}
        >
          {/* Décor à l'intérieur du badge — mobile */}
          <div
            className="-translate-y-1/2 absolute md:hidden"
            style={{ ...badgeVectorStyle, position: "absolute" }}
          >
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={vectorSrc} />
          </div>
        </div>
        <p
          className="absolute font-landing-body font-bold leading-normal text-[16px] whitespace-nowrap"
          style={{ color: textColor, left: labelOffsetX, top: "calc(50% - 11px)" }}
        >
          {label}
        </p>
      </div>

      {/* Texte */}
      <p className="font-landing-body text-[#eee]/70 text-[15px] md:text-[16px] leading-relaxed relative">
        {description}
      </p>
    </div>
  );
}
