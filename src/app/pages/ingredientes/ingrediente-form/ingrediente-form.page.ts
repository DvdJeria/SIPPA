import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// FORMULARIOS REACTIVOS
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

//COMPONENTES DE IONIC (Tree-Shaking)
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonButtons, IonBackButton, IonInput, IonItem, IonLabel,
  IonSelect, IonSelectOption, IonToggle, IonSpinner, IonText, IonList
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';


//ERVICIOS Y MODELOS (¡Revisa y ajusta estas rutas!)
import { SupabaseService } from '../../../services/supabase';
import { Ingrediente, UnidadMedida } from 'src/app/models/ingredientes';


@Component({
  selector: 'app-ingrediente-form',
  templateUrl: './ingrediente-form.page.html',
  styleUrls: ['./ingrediente-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // <-- Necesario para el formulario
    // Componentes de Ionic:
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
    IonButtons, IonBackButton, IonInput, IonItem, IonLabel,
    IonSelect, IonSelectOption, IonToggle, IonSpinner, IonText, IonList
  ],
})
export class IngredienteFormPage implements OnInit {
  // 💉 Inyección de dependencias
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);

  // Variables de estado
  ingredienteForm!: FormGroup;
  ingredienteId: string | null = null;
  unidades: UnidadMedida[] = []; // Lista de unidades de medida para el select
  isLoading: boolean = false;
  isEditing: boolean = false;

  constructor() {
    addIcons({ saveOutline });
  }

  ngOnInit() {
    // 1. Leer el parámetro ID de la URL
    this.ingredienteId = this.route.snapshot.paramMap.get('id');
    this.isEditing = !!this.ingredienteId;

    // 2. Inicializar la estructura del formulario
    this.initForm();

    // 3. Cargar las opciones para el <ion-select>
    this.loadSelectData();

    // 4. Si estamos editando, cargar los datos actuales
    if (this.isEditing && this.ingredienteId) {
      this.loadIngredienteData(this.ingredienteId);
    }
  }

  // --- MÉTODOS DE INICIALIZACIÓN ---

  initForm() {
    this.ingredienteForm = this.fb.group({
      // Validaciones necesarias
      ing_nombre: ['', [Validators.required, Validators.maxLength(100)]],
      ing_precio: [0, [Validators.required, Validators.min(0)]],
      ing_estado: [true], // Estado inicial (Activo)
      // Usamos '0' como valor inicial de tipo number, coincidiendo con INT4
      unmed_id: [0, [Validators.required, Validators.min(1)]],
      // Usamos min(1) para forzar la selección de una opción real.
    });
  }

  async loadSelectData() {
    this.isLoading = true;
    try {
      // 🚨 LLAMADA REAL: Obtiene los datos de la tabla 'unidad_medida'
      this.unidades = await this.supabaseService.getUnidadesMedida();
    } catch (error) {
      console.error('Error al cargar unidades de medida:', error);
      alert('No se pudieron cargar las unidades de medida. Verifique la conexión o las políticas RLS.');
    } finally {
      this.isLoading = false;
    }
  }

  async loadIngredienteData(id: string) {
    this.isLoading = true;
    try {
      // 🚨 LLAMADA REAL: Obtener datos del servicio
      const ingrediente = await this.supabaseService.getIngredienteById(id);

      // Si la llamada es exitosa, parchamos el formulario con los valores.
      this.ingredienteForm.patchValue(ingrediente);

    } catch (error) {
      console.error('Error al cargar datos del ingrediente:', error);
      alert('Error al cargar los datos del ingrediente. Puede que no exista o falten permisos.');
      this.router.navigate(['/ingredientes']); // Volver si falla la carga
    } finally {
      this.isLoading = false;
    }
  }

  // --- MÉTODOS DE ACCIÓN ---

  async onSubmit() {
    if (this.ingredienteForm.invalid) {
      alert('Por favor, completa todos los campos requeridos correctamente.');
      this.ingredienteForm.markAllAsTouched(); // Mostrar errores visualmente
      return;
    }

    this.isLoading = true;
    // El formulario retorna un objeto Ingrediente (sin stock)
    const formValue = this.ingredienteForm.value as Partial<Ingrediente>;

    try {
      if (this.isEditing && this.ingredienteId) {
        // 🚨 MODO EDICIÓN
        await this.supabaseService.updateIngrediente(this.ingredienteId, formValue);
        alert('Ingrediente actualizado con éxito.');
      } else {
        // 🚨 MODO AGREGAR
        await this.supabaseService.addIngrediente(formValue);
        alert('Ingrediente agregado con éxito.');
      }

      // Navegar de vuelta al listado
      this.router.navigate(['/ingredientes']);

    } catch (error) {
      console.error('Error al guardar datos:', error);
      alert('Ocurrió un error al intentar guardar/actualizar el ingrediente. Verifique RLS.');
    } finally {
      this.isLoading = false;
    }
  }
}
