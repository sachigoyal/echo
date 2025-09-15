import React, { useState } from 'react';

import { OptionButtons } from './option-buttons';
import { Template } from './template';

import type {
  Template as TemplateType,
  TemplateGroup as TemplateGroupType,
} from './types';

interface Props {
  templateGroup: TemplateGroupType;
  appId: string;
}

export const TemplateGroup: React.FC<Props> = ({ templateGroup, appId }) => {
  if (templateGroup.type === 'templates') {
    return (
      <TemplateGroupTemplates
        templates={templateGroup.templates}
        appId={appId}
      />
    );
  } else {
    return (
      <TemplateGroupSubgroups
        subgroups={templateGroup.subgroups}
        subtitle={templateGroup.subtitle}
        appId={appId}
      />
    );
  }
};

interface TemplateGroupTemplatesProps {
  templates: TemplateType[];
  appId: string;
}

const TemplateGroupTemplates: React.FC<TemplateGroupTemplatesProps> = ({
  templates,
  appId,
}) => {
  const [selectedId, setSelectedId] = useState<string>(templates[0].id);

  const selectedTemplate = templates.find(
    template => template.id === selectedId
  );

  return (
    <>
      <OptionButtons
        title="Template"
        options={templates}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
      />
      {selectedTemplate && (
        <Template template={selectedTemplate} appId={appId} />
      )}
    </>
  );
};

interface TemplateGroupSubgroupsProps {
  subtitle: string;
  subgroups: TemplateGroupType[];
  appId: string;
}

const TemplateGroupSubgroups: React.FC<TemplateGroupSubgroupsProps> = ({
  subgroups,
  subtitle,
  appId,
}) => {
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string>(
    subgroups[0].id
  );

  const selectedSubgroup = subgroups.find(
    subgroup => subgroup.id === selectedSubgroupId
  );

  return (
    <>
      <OptionButtons
        title={subtitle}
        options={subgroups}
        selectedId={selectedSubgroupId}
        setSelectedId={setSelectedSubgroupId}
      />
      {selectedSubgroup && (
        <TemplateGroup
          templateGroup={selectedSubgroup}
          key={selectedSubgroupId}
          appId={appId}
        />
      )}
    </>
  );
};
