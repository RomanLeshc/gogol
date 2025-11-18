import { UserRestrictions } from '@/lib/types';
import { FeatureBadge } from '@/components/stats/FeatureBadge';

interface FeatureAccessSectionProps {
  restrictions: UserRestrictions;
}

export function FeatureAccessSection({ restrictions }: FeatureAccessSectionProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Feature Access
      </h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureBadge
            enabled={restrictions.features.canCreateAgents}
            label="Create Agents"
          />
          <FeatureBadge
            enabled={restrictions.features.canUploadFiles}
            label="Upload Files"
          />
          <FeatureBadge
            enabled={restrictions.features.canUseRAG}
            label="RAG (Retrieval Augmented Generation)"
          />
          <FeatureBadge
            enabled={restrictions.features.canUseCustomDomains}
            label="Custom Domains"
          />
          <FeatureBadge
            enabled={restrictions.features.canUseWebhooks}
            label="Webhooks"
          />
          <FeatureBadge
            enabled={restrictions.features.canExportData}
            label="Data Export"
          />
          <FeatureBadge
            enabled={restrictions.features.canAccessAPI}
            label="API Access"
          />
        </div>
      </div>
    </div>
  );
}

