import React, { useState, useRef, useEffect } from 'react';

export interface SidebarItem {
  id: string;
  title: string;
  type: 'section' | 'task' | 'page';
  children?: SidebarItem[];
  active?: boolean;
  onClick?: () => void;
}

interface SidebarProps {
  items: SidebarItem[];
  onSelect: (id: string) => void;
  activeId: string;
  showMobile: boolean;
  setShowMobile: (v: boolean) => void;
  searchPlaceholder?: string;
}

export default function Sidebar({ items, onSelect, activeId, showMobile, setShowMobile, searchPlaceholder }: SidebarProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({});
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Закрытие меню по клику вне
  useEffect(() => {
    if (!showMobile) return;
    function handleClick(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobile(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMobile, setShowMobile]);

  // Фильтрация по поиску
  function filterItems(items: SidebarItem[]): SidebarItem[] {
    return items
      .map(item => {
        if (item.children) {
          const filteredChildren = filterItems(item.children);
          if (filteredChildren.length > 0 || item.title.toLowerCase().includes(search.toLowerCase())) {
            return { ...item, children: filteredChildren };
          }
          return null;
        }
        if (item.title.toLowerCase().includes(search.toLowerCase())) return item;
        return null;
      })
      .filter(Boolean) as SidebarItem[];
  }

  const filteredItems = search ? filterItems(items) : items;

  function handleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function renderTree(items: SidebarItem[], level = 0) {
    return (
      <ul className={level === 0 ? 'space-y-2' : 'ml-3 mt-1 space-y-1'}>
        {items.map((item) => (
          <li key={item.id}>
            <div className={`flex items-center group ${item.type === 'section' ? 'font-semibold' : ''}`}>
              {item.children && (
                <button
                  className="mr-1 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                  onClick={() => handleExpand(item.id)}
                  aria-label={expanded[item.id] ? 'Свернуть' : 'Развернуть'}
                  tabIndex={0}
                >
                  <svg width="16" height="16" className={`transform transition-transform duration-200 ${expanded[item.id] ? 'rotate-90' : ''}`}><polyline points="4,6 8,10 12,6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                </button>
              )}
              <button
                className={`w-full text-left px-2 py-1 rounded transition-colors duration-200 ease-in-out ${item.active || item.id === activeId ? 'bg-blue-100 text-blue-800' : 'text-gray-900 hover:bg-blue-50'} ${item.type === 'task' ? 'font-mono' : ''}`}
                onClick={() => {
                  onSelect(item.id);
                  if (item.onClick) item.onClick();
                  setShowMobile(false);
                }}
              >
                {item.title}
              </button>
            </div>
            {item.children && expanded[item.id] && (
              <div className="animate-fade-slide-in">
                {renderTree(item.children, level + 1)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  // Мобильное меню (offcanvas)
  if (showMobile) {
    return (
      <div className="fixed inset-0 z-40 bg-black/30 flex">
        <div
          ref={mobileMenuRef}
          className="w-80 max-w-full bg-white h-full shadow-xl p-4 animate-fade-slide-in relative flex flex-col"
        >
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-blue-600 transition-colors"
            onClick={() => setShowMobile(false)}
            aria-label="Закрыть меню"
          >
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="22" y2="22"/><line x1="6" y1="22" x2="22" y2="6"/></svg>
          </button>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder || 'Поиск...'}
            className="w-full mb-4 px-3 py-2 rounded border border-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <nav className="overflow-y-auto flex-1 pr-1">
            {renderTree(filteredItems)}
          </nav>
        </div>
        <div className="flex-1" />
      </div>
    );
  }

  // Десктоп-версия
  return (
    <aside className="w-64 bg-white rounded-lg shadow p-4 h-fit sticky top-8 self-start hidden md:block transition-shadow duration-300 ease-in-out">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={searchPlaceholder || 'Поиск...'}
        className="w-full mb-4 px-3 py-2 rounded border border-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
      />
      <nav className="overflow-y-auto max-h-[70vh] pr-1">
        {renderTree(filteredItems)}
      </nav>
    </aside>
  );
} 