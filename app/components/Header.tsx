'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import Sidebar, { SidebarItem } from './Sidebar';

// Импорт компонентов Navigation Menu, Sheet из shadcn/ui
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose // Импорт SheetClose
} from "@/components/ui/sheet";
import { cn } from '@/lib/utils';

interface HeaderProps {
  sidebarItems?: SidebarItem[];
  onSidebarSelect?: (id: string) => void;
  activeSidebarId?: string;
}

// Вспомогательный компонент ListItem для выпадающих меню
const ListItem = ({ className, title, children, href, ...props }: React.ComponentPropsWithoutRef<"a"> & { href: string }) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

export default function Header({ sidebarItems, onSidebarSelect, activeSidebarId }: HeaderProps) {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto px-4">
        <div className="flex items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              BitLab
            </Link>
          </div>

          {/* Контейнер для Navigation Menu И Аватар/Войти - прижат к правому краю */}
          <div className="flex items-center ml-auto space-x-4">

             {/* Navigation Menu для десктопа */}
              {session ? (
                <div className="hidden md:block">
                  <NavigationMenu>
                    <NavigationMenuList>
                      {/* Пункт меню "Тесты" */}
                      <NavigationMenuItem>
                        <NavigationMenuTrigger>Тесты</NavigationMenuTrigger>
                        <NavigationMenuContent style={{ minWidth: '436px' }}>
                          <ul className="grid gap-1 p-4 md:grid-cols-2 max-w-lg lg:max-w-xl">
                            <ListItem href="/tests/selection" title="Подборка заданий">
                              Сгенерировать подборку заданий.
                            </ListItem>
                              <ListItem href="/tests/variants" title="Варианты">
                                Решать готовые варианты тестов.
                              </ListItem>
                              <ListItem href="/tests/daily" title="Задача дня">
                                Ежедневное задание.
                              </ListItem>
                           </ul>
                         </NavigationMenuContent>
                      </NavigationMenuItem>

                      {/* Пункт меню "Материал" */}
                      <NavigationMenuItem>
                        <NavigationMenuTrigger>Материал</NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid gap-1 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                            <ListItem href="/theory" title="Теория">
                              Теоретические материалы по темам.
                            </ListItem>
                            <ListItem href="/tasks" title="Задачи">
                              Практические задания для закрепления.
                            </ListItem>
                            <ListItem href="/tests" title="Тесты">
                              Тесты для самопроверки знаний.
                            </ListItem>
                            <ListItem href="/ai-assistant" title="ИИ Ассистент">
                              Получите помощь от ИИ.
                            </ListItem>
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>

                      {/* Пункт меню "Профиль" */}
                      <NavigationMenuItem>
                        <NavigationMenuTrigger>Профиль</NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[200px] gap-3 p-4">
                            <ListItem href="/profile" title="Мой профиль">
                              Просмотр и редактирование профиля.
                           </ListItem>
                             {/* Кнопка Выход в ListItem */}
                             <ListItem onClick={() => signOut()} title="Выход" href="#">
                               Завершить текущую сессию.
                             </ListItem>
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>

                    </NavigationMenuList>
                  </NavigationMenu>
                </div>
              ) : null}

             {/* Мобильное меню кнопка и Аватар/Войти */}
              <div className="flex items-center space-x-4">
               {/* Мобильное меню кнопка (SheetTrigger) */}
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <button
                      className="md:hidden text-gray-600 hover:text-blue-600"
                      aria-label="Open mobile menu"
                    >
                       <svg
                        className="h-6 w-6"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {isMenuOpen ? (
                          <path d="M6 18L18 6M6 6l12 12" />
                        ) : (
                          <path d="M4 6h16M4 12h16M4 18h16" />
                        )}
                      </svg>
                    </button>
                  </SheetTrigger>
                  {session && (
                    <SheetContent side="right" className="w-[250px] sm:w-[300px] p-4">
                      <SheetHeader>
                        <SheetTitle>Меню навигации</SheetTitle>
                         {/* <SheetDescription>Описание меню, если нужно</SheetDescription> */}
                      </SheetHeader>
                      <nav className="flex flex-col space-y-2 mt-4">
                        {/* Мобильное меню ссылки */}
                         <SheetClose asChild>
                           <Link href="/theory" className="block text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Теория</Link>
                         </SheetClose>
                         <SheetClose asChild>
                           <Link href="/tasks" className="block text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Задачи</Link>
                         </SheetClose>
                         <SheetClose asChild>
                           <Link href="/tests" className="block text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Тесты</Link>
                         </SheetClose>
                         <SheetClose asChild>
                           <Link href="/ai-assistant" className="block text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>ИИ Ассистент</Link>
                         </SheetClose>
                         <SheetClose asChild>
                            <Link href="/profile" className="block text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Мой профиль</Link>
                         </SheetClose>
                         <SheetClose asChild>
                           <button onClick={() => signOut()} className="block text-gray-700 hover:text-blue-600 w-full text-left">Выход</button>
                         </SheetClose>

                         {/* Sidebar-меню для мобильных внутри Sheet */}
                          {sidebarItems && (
                           <div className="mt-6 border-t pt-4">
                             <Sidebar
                               items={sidebarItems}
                               onSelect={(id) => { // Закрываем Sheet при выборе пункта сайдбара
                                setIsMenuOpen(false);
                                if (onSidebarSelect) onSidebarSelect(id);
                               }}
                               activeId={activeSidebarId || ''}
                               showMobile={true}
                               setShowMobile={() => {}} // Управление видимостью через isMenuOpen Header'ом
                               searchPlaceholder="Поиск по разделам..."
                             />
                           </div>
                         )}
                      </nav>
                    </SheetContent>
                  )}
                 </Sheet>

                {session ? (
                   // Место для компонента Аватар (отображается только при наличии сессии)
                  <div className="flex items-center">
                     {/* TODO: Замените этот div на компонент Shadcn UI Avatar после его установки */}
                     <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">А</div>
                   </div>
                ) : (
                  <Link
                    href="/auth"
                    className="text-gray-600 hover:text-blue-600"
                  >
                    Войти
                  </Link>
                )}
              </div>
          </div>
        </div>

        {/* Мобильное меню - УДАЛЕНО, теперь используется Sheet */}
        {/* {isMenuOpen && session && (
          <div className="md:hidden py-4 space-y-2">
            <Link href="/theory" className="block text-gray-600 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Теория</Link>
            <Link href="/tasks" className="block text-gray-600 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Задачи</Link>
            <Link href="/tests" className="block text-gray-600 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Тесты</Link>
            <Link href="/ai-assistant" className="block text-gray-600 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>ИИ Ассистент</Link>
            <Link href="/profile" className="block text-gray-600 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Мой профиль</Link>
            <button onClick={() => signOut()} className="block text-gray-600 hover:text-blue-600 w-full text-left">Выход</button>
            {sidebarItems && (
              <div className="mt-6 border-t pt-4">
                <Sidebar
                  items={sidebarItems}
                  onSelect={onSidebarSelect || (() => {})}
                  activeId={activeSidebarId || ''}
                  showMobile={true}
                  setShowMobile={() => {}}
                  searchPlaceholder="Поиск по разделам..."
                />
              </div>
            )}
          </div>
        )} */}
      </nav>
    </header>
  );
} 