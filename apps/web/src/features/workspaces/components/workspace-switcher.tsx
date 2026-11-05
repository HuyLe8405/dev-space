'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronsUpDown, Check, Plus } from 'lucide-react';
import { useWorkspaces } from '../hooks/use-workspaces';
import { ICON_MAP } from './icon-picker';
import { COLOR_CONFIG } from './color-picker';
import { CreateWorkspaceDialog } from './create-workspace-dialog';

export function WorkspaceSwitcher() {
  const router = useRouter();
  const { workspaces, activeWorkspace, isLoading, setActiveWorkspaceId } =
    useWorkspaces();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Total navigable items = workspaces.length + 1 (the "+ Create Workspace" action)
  const totalItems = workspaces.length + 1;

  const getInitialIndex = useCallback(() => {
    if (!activeWorkspace) return 0;
    const idx = workspaces.findIndex((w) => w.id === activeWorkspace.id);
    return idx >= 0 ? idx : 0;
  }, [activeWorkspace, workspaces]);

  // When dropdown opens, set focused index and focus the item
  useEffect(() => {
    if (isOpen) {
      const initialIdx = getInitialIndex();
      setFocusedIndex(initialIdx);
      const timer = setTimeout(() => {
        itemRefs.current[initialIdx]?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, getInitialIndex]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (focusedIndex + 1) % totalItems;
      setFocusedIndex(nextIndex);
      itemRefs.current[nextIndex]?.focus();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (focusedIndex - 1 + totalItems) % totalItems;
      setFocusedIndex(prevIndex);
      itemRefs.current[prevIndex]?.focus();
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
      itemRefs.current[0]?.focus();
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      const lastIndex = totalItems - 1;
      setFocusedIndex(lastIndex);
      itemRefs.current[lastIndex]?.focus();
      return;
    }

    if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading workspaces"
        className="w-24 sm:w-28 h-7 rounded-lg bg-muted/40 animate-pulse flex items-center"
      >
        <span className="sr-only">Loading workspaces...</span>
      </div>
    );
  }

  // If user has zero workspaces, provide immediate "+ Create Workspace" trigger
  if (workspaces.length === 0) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[80px] sm:max-w-none">New Workspace</span>
        </button>

        <CreateWorkspaceDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      </>
    );
  }

  const ActiveIcon = activeWorkspace
    ? ICON_MAP[activeWorkspace.icon] || ICON_MAP.Briefcase
    : null;
  const activeColorConfig = activeWorkspace
    ? COLOR_CONFIG[activeWorkspace.color] || COLOR_CONFIG.blue
    : null;

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    setIsOpen(false);
    router.push(`/workspaces/${id}`);
    triggerRef.current?.focus();
  };

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleTriggerKeyDown}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label="Workspace switcher"
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-lg border border-border/80 bg-card/60 hover:bg-muted/50 hover:border-border text-foreground transition-all focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {ActiveIcon && activeColorConfig && (
            <div
              className={`w-4 h-4 flex items-center justify-center shrink-0 ${activeColorConfig.text}`}
            >
              <ActiveIcon className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="text-xs font-medium truncate max-w-[90px] sm:max-w-[180px]">
            {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
          </span>
          <ChevronsUpDown className="w-3 h-3 text-muted-foreground/80 shrink-0 ml-0.5" />
        </button>

        {isOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            aria-label="Select a workspace"
            onKeyDown={handleMenuKeyDown}
            className="absolute left-0 mt-1.5 w-60 rounded-xl border border-border bg-card shadow-2xl py-1.5 text-xs text-foreground z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3 py-1.5 border-b border-border/60">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Workspaces ({workspaces.length})
              </span>
            </div>

            <div className="py-1 max-h-56 overflow-y-auto">
              {workspaces.map((ws, index) => {
                const ItemIcon = ICON_MAP[ws.icon] || ICON_MAP.Briefcase;
                const itemColor = COLOR_CONFIG[ws.color] || COLOR_CONFIG.blue;
                const isSelected = activeWorkspace?.id === ws.id;

                return (
                  <button
                    key={ws.id}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    type="button"
                    role="menuitem"
                    tabIndex={focusedIndex === index ? 0 : -1}
                    onClick={() => handleSelectWorkspace(ws.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors focus:outline-none focus:bg-muted/70 ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-4 h-4 flex items-center justify-center ${itemColor.text}`}
                      >
                        <ItemIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{ws.name}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-1 border-t border-border/60">
              <button
                ref={(el) => {
                  itemRefs.current[workspaces.length] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={focusedIndex === workspaces.length ? 0 : -1}
                onClick={() => {
                  setIsOpen(false);
                  setIsCreateOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 focus:outline-none focus:bg-primary/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateWorkspaceDialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          triggerRef.current?.focus();
        }}
      />
    </>
  );
}
