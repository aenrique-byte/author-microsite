import { useState } from 'react'
import HeroSettingsTab from './homepage/HeroSettingsTab'
import ActivityFeedTab from './homepage/ActivityFeedTab'
import ToolsTab from './homepage/ToolsTab'

type TabType = 'hero' | 'activity' | 'tools'

export default function HomepageManager() {
  const [activeTab, setActiveTab] = useState<TabType>('hero')

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'hero', label: 'Hero Settings', icon: '🏠' },
    { id: 'activity', label: 'Activity Feed', icon: '📰' },
    { id: 'tools', label: 'Tools', icon: '🔧' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'hero' && <HeroSettingsTab />}
        {activeTab === 'activity' && <ActivityFeedTab />}
        {activeTab === 'tools' && <ToolsTab />}
      </div>
    </div>
  )
}
