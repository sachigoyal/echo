interface Props {
  title: string;
  children: React.ReactNode;
}

export const Section: React.FC<Props> = ({ children, title }) => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">{title}</h1>
      {children}
    </div>
  );
};

interface SubSectionProps extends Props {
  actions?: React.ReactNode;
}

export const SubSection: React.FC<SubSectionProps> = ({
  children,
  title,
  actions,
}) => {
  return (
    <div className="w-full flex flex-col gap-2 md:gap-3 max-w-full h-full">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-foreground/60">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
};
