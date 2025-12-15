import { useLocation, Link } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  path: string
}

export default function Breadcrumb() {
  const location = useLocation()
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    
    // Remove 'admin' from the beginning if present
    if (pathSegments[0] === 'admin') {
      pathSegments.shift()
    }
    
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', path: '/admin' }
    ]
    
    // Map path segments to readable labels
    const pathLabels: Record<string, string> = {
      'author': 'Author Profile',
      'galleries': 'Image Galleries',
      'stories': 'Stories & Chapters',
      'socials': 'Social Media',
      'newsletter': 'Newsletter',
      'moderation': 'Moderation',
      'password': 'Change Password',
      'analytics': 'Analytics'
    }
    
    let currentPath = '/admin'
    
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`
      const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      
      breadcrumbs.push({
        label,
        path: currentPath
      })
    })
    
    return breadcrumbs
  }
  
  const breadcrumbs = getBreadcrumbs()
  
  // Don't show breadcrumbs on the main dashboard
  if (breadcrumbs.length <= 1) {
    return null
  }
  
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.path} className="flex items-center">
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-gray-400 mx-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              
              {index === breadcrumbs.length - 1 ? (
                <span className="text-gray-500 font-medium">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}
