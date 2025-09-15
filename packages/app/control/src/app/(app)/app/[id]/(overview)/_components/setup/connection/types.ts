export type TemplateShared = {
  id: string;
  title: string;
  description: string;
  Icon: (props: { className?: string }) => React.ReactNode;
};

export type TemplateGroup = TemplateShared &
  (
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

export type Template = TemplateShared & {
  command: (appId: string) => string;
};
