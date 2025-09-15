export type TemplateShared = {
  id: string;
  title: string;
  description: string;
  Icon: (props: { className?: string }) => React.ReactNode;
};

export type TemplateGroup = TemplateShared & {
  moreAdvanced: React.ReactNode;
} & (
    | {
        type: 'subgroup';
        subtitle: string;
        subgroups: TemplateGroup[];
      }
    | {
        type: 'templates';
        templates: Template[];
      }
  );

export type Template = TemplateShared;
