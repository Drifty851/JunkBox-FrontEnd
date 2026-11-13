import houseIcon from '../../assets/icons/house.svg'
import personIcon from '../../assets/icons/person.svg'
import searchIcon from '../../assets/icons/search-22.svg'
import squarePlusIcon from '../../assets/icons/square-plus.svg'
import { WRITE_REVIEW_PATH } from '../../features/reviews/models/writeReview'
import { SEARCH_PATH } from '../../features/search/models/search.types'
import { SETTINGS_PATH as SETTINGS_ROUTE } from '../../features/settings/models/settings'
import type { NavigationItem } from '../../shared/layout/navigation.types'

/**
 * Destinos de la navegación principal (Figma · BottomBar y Navbar).
 * `to: null` = el módulo aún no existe. Al implementar Buscador, Reseñas o Perfil,
 * basta con poner aquí su ruta.
 */
export const HOME_ITEM: NavigationItem = { label: 'Inicio', to: '/', icon: houseIcon }
export const SEARCH_ITEM: NavigationItem = { label: 'Buscador', to: SEARCH_PATH, icon: searchIcon }
export const CREATE_REVIEW_ITEM: NavigationItem = { label: 'Crear Reseña', to: WRITE_REVIEW_PATH, icon: squarePlusIcon }
export const PROFILE_ITEM: NavigationItem = { label: 'Perfil', to: null, icon: personIcon }

/** Configuración (menú del avatar y Navbar). Módulo Configuración (2026-11-13). */
export const SETTINGS_PATH: string | null = SETTINGS_ROUTE

/** BottomBar (móvil): los cuatro destinos en el orden de Figma. */
export const BOTTOM_BAR_ITEMS: NavigationItem[] = [HOME_ITEM, SEARCH_ITEM, CREATE_REVIEW_ITEM, PROFILE_ITEM]

/** Navbar (escritorio): enlaces del centro. "Crear Reseña" es un botón aparte. */
export const NAVBAR_LINKS: NavigationItem[] = [HOME_ITEM, SEARCH_ITEM, PROFILE_ITEM]
