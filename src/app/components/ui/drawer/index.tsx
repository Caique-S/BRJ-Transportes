"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  const [isCarregamentoOpen, setIsCarregamentoOpen] = useState(false);
  const pathname = usePathname();

  const overlayClasses = isOpen
    ? "fixed top-0 left-0 right-0 bottom-0 z-30 pointer-events-none"
    : "hidden";

  const drawerClasses = isOpen
    ? "fixed top-20 left-0 z-50 h-screen p-4 overflow-y-auto transition-transform bg-white w-4/6 shadow-xl"
    : "fixed top-20 left-0 z-50 h-screen p-4 overflow-y-auto transition-transform -translate-x-full bg-white w-3/5 ";

  const handleNavigation = () => {
    onClose();
  };

  // Função para alternar o submenu
  const toggleCarregamentoMenu = () => {
    setIsCarregamentoOpen(!isCarregamentoOpen);
  };

  // Verificar se a rota está ativa
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      <div className={overlayClasses} onClick={onClose} aria-hidden="true" />

      <div
        id="drawer-navigation"
        className={drawerClasses}
        aria-labelledby="drawer-navigation-label"
      >
        <div className="pb-4 flex items-center">
          <Link
            href="/"
            className="flex items-center space-x-2 rtl:space-x-reverse"
            onClick={handleNavigation}
          >
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQ4OcHN7A7gSuqSswoxGWm7CYJT1F2CSeUkQ&s"
              className="h-8 w-14"
              alt="Logo BRJ Transportes"
            />
            <span className="self-center text-lg font-semibold whitespace-nowrap text-heading">
              BRJ Transportes
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="text-body bg-transparent hover:text-heading hover:bg-neutral-tertiary rounded-base w-9 h-9 absolute top-2.5 end-2.5 flex items-center justify-center"
            aria-label="Fechar menu"
          >
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18 17.94 6M18 18 6.06 6"
              />
            </svg>
            <span className="sr-only">Close menu</span>
          </button>
        </div>
        <div className="py-5 overflow-y-auto">
          <ul className="space-y-2 font-medium">
            <li>
              <Link
                href="/"
                className={`flex items-center px-2 py-1.5 rounded-base group ${isActive("/") ? "bg-blue-50 text-blue-700" : "text-body hover:bg-neutral-tertiary hover:text-fg-brand"}`}
                onClick={handleNavigation}
              >
                <svg
                  className={`w-5 h-5 transition duration-75 ${isActive("/") ? "text-blue-700" : "group-hover:text-fg-brand"}`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6.025A7.5 7.5 0 1 0 17.975 14H10V6.025Z"
                  />
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.5 3c-.169 0-.334.014-.5.025V11h7.975c.011-.166.025-.331.025-.5A7.5 7.5 0 0 0 13.5 3Z"
                  />
                </svg>
                <span className="ms-3">Home</span>
              </Link>
            </li>

            <li>
              <button
                type="button"
                className="flex items-center w-full justify-between px-2 py-1.5 text-body rounded-base hover:bg-neutral-tertiary hover:text-fg-brand group"
                onClick={toggleCarregamentoMenu}
                aria-expanded={isCarregamentoOpen}
              >
                <svg
                  className="shrink-0 w-5 h-5 text-black-500 transition duration-75 group-hover:text-fg-brand"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 5v14m-7-7h14"
                  />
                </svg>
                <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">
                  Carregamento
                </span>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${isCarregamentoOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 9-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Submenu Carregamento */}
              <ul
                className={`py-2 space-y-2 transition-all duration-200 ${isCarregamentoOpen ? "block" : "hidden"}`}
                id="dropdown-example"
              >
                <li>
                  <Link
                    href="/carregamento/new"
                    className={`pl-10 flex items-center px-2 py-1.5 rounded-base ${isActive("/novo-carregamento") ? "bg-blue-50 text-blue-700" : "text-body hover:bg-neutral-tertiary hover:text-fg-brand"}`}
                    onClick={handleNavigation}
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-black-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 5v14m-7-7h14"
                      />
                    </svg>
                    Novo carregamento
                  </Link>
                </li>
                <li>
                  <Link
                    href="/carregamento/dashboard"
                    className={`pl-10 flex items-center px-2 py-1.5 rounded-base ${isActive("/carregamentos/dashboard") ? "bg-blue-50 text-blue-700" : "text-body hover:bg-neutral-tertiary hover:text-fg-brand"}`}
                    onClick={handleNavigation}
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-black-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 6.025A7.5 7.5 0 1 0 17.975 14H10V6.025Z"
                      />
                    </svg>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/carregamento/report"
                    className={`pl-10 flex items-center px-2 py-1.5 rounded-base ${isActive("/carregamentos/relatorios") ? "bg-blue-50 text-blue-700" : "text-body hover:bg-neutral-tertiary hover:text-fg-brand"}`}
                    onClick={handleNavigation}
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-black-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 19V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14H5Z"
                      />
                    </svg>
                    Relatórios
                  </Link>
                </li>
              </ul>
            </li>

            <li>
              <Link
                href="/mensagens"
                className={`flex items-center px-2 py-1.5 rounded-base group ${isActive("/mensagens") ? "bg-blue-50 text-blue-700" : "text-body hover:bg-neutral-tertiary hover:text-fg-brand"}`}
                onClick={handleNavigation}
              >
                <svg
                  className={`shrink-0 w-5 h-5 text-black-500 transition duration-75 ${isActive("/mensagens") ? "text-blue-700" : "group-hover:text-fg-brand"}`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 13h3.439a.991.991 0 0 1 .908.6 3.978 3.978 0 0 0 7.306 0 .99.99 0 0 1 .908-.6H20M4 13v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6M4 13l2-9h12l2 9M9 7h6m-7 3h8"
                  />
                </svg>
                <span className="flex-1 ms-3 whitespace-nowrap">Mensagens</span>
                <span className="inline-flex items-center justify-center w-4.5 h-4.5 ms-2 text-xs font-medium text-fg-danger-strong bg-danger-soft border border-danger-subtle rounded-full">
                  2
                </span>
              </Link>
            </li>

            <li>
              <Link
                href="/perfil"
                className={`flex items-center px-2 py-1.5 rounded-base group ${isActive("/perfil") ? "bg-blue-50 text-blue-700" : "text-body hover:bg-neutral-tertiary hover:text-fg-brand"}`}
                onClick={handleNavigation}
              >
                <svg
                  className={`shrink-0 w-5 h-5 text-black-500 transition duration-75 ${isActive("/perfil") ? "text-blue-700" : "group-hover:text-fg-brand"}`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                    d="M16 19h4a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-2m-2.236-4a3 3 0 1 0 0-4M3 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
                <span className="flex-1 ms-3 whitespace-nowrap">Perfil</span>
              </Link>
            </li>

            <li className="flex items-center px-2 py-1.5 text-body rounded-base hover:bg-neutral-tertiary hover:text-fg-brand group">
                <svg
                  className="shrink-0 w-5 h-5 text-black-500 transition duration-75 group-hover:text-fg-brand"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"
                  />
                </svg>
                <span className="flex-1 ms-3 whitespace-nowrap">Sair</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
