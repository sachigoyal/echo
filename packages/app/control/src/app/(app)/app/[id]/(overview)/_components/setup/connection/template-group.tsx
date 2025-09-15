import React, { useState } from 'react';

import { OptionButtons } from './option-buttons';
import { Template } from './template';

import type {
  Template as TemplateType,
  TemplateGroup as TemplateGroupType,
} from './types';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

interface Props {
  templateGroup: TemplateGroupType;
  appId: string;
  index: number;
}

export const TemplateGroup: React.FC<Props> = ({
  templateGroup,
  appId,
  index,
}) => {
  if (templateGroup.type === 'templates') {
    return (
      <TemplateGroupTemplates
        templates={templateGroup.templates}
        appId={appId}
        index={index}
      />
    );
  } else {
    return (
      <TemplateGroupSubgroups
        subgroups={templateGroup.subgroups}
        subtitle={templateGroup.subtitle}
        appId={appId}
        index={index}
      />
    );
  }
};

interface TemplateGroupTemplatesProps {
  templates: TemplateType[];
  appId: string;
  index: number;
}

const TemplateGroupTemplates: React.FC<TemplateGroupTemplatesProps> = ({
  templates,
  appId,
  index,
}) => {
  const [selectedId, setSelectedId] = useState<string>();

  const selectedTemplate = templates.find(
    template => template.id === selectedId
  );

  return (
    <motion.div>
      <OptionButtons
        title="Choose a Template"
        options={templates}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        index={index}
      />
      <motion.div
        initial={{ height: 0 }}
        animate={{
          height: selectedTemplate ? 'auto' : 0,
        }}
      >
        {selectedTemplate && (
          <Template
            template={selectedTemplate}
            appId={appId}
            key={selectedId}
            index={index + 1}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

interface TemplateGroupSubgroupsProps {
  subtitle: string;
  subgroups: TemplateGroupType[];
  appId: string;
  index: number;
}

const TemplateGroupSubgroups: React.FC<TemplateGroupSubgroupsProps> = ({
  subgroups,
  subtitle,
  appId,
  index,
}) => {
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string>();

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
        index={index}
      />

      <motion.div
        initial={{ height: 0, marginTop: 0 }}
        animate={{
          height: selectedSubgroup ? 'auto' : 0,
          marginTop: selectedSubgroup ? 16 : 0,
        }}
      >
        {selectedSubgroup && (
          <TemplateGroup
            templateGroup={selectedSubgroup}
            key={selectedSubgroupId}
            appId={appId}
            index={index + 1}
          />
        )}
      </motion.div>
    </>
  );
};
