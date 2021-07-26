//autobind decorator
function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        enumerable: false,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn
        }
    };
    return adjDescriptor
}

enum ProjectStatus { Active, Finished}
//Project Type
class Project {
    constructor(public id: string, public title: string, public description: string, public people: number, public status : ProjectStatus) {
    }
}
//Project State Management
type listener<T> = (items : T[]) => void

class State <T>{
    protected listeners: listener<T>[] = []
    addListener(listenerFn: listener<T>) {
        this.listeners.push(listenerFn)
    }
}
class ProjectState extends State<Project> {
    //listeners array is for the refernce of functions
  
    private projects: Project[] = [];
    private static instance: ProjectState;
    private constructor(){
        super();
    }

    static getInstance() {
        if (this.instance) {
            return this.instance
        }
        this.instance = new ProjectState()
        return this.instance
    }

    addProjects(title: string, description: string, numOfPeople: number) {
        const newProject = new Project(
            Math.random().toString(),
            title,
            description,
            numOfPeople,
            ProjectStatus.Active
        )
        this.projects.push(newProject)
        for (const listenterFn of this.listeners) {
            listenterFn(this.projects.slice())
        }
    }

}

const projectState = ProjectState.getInstance()

//Validation
interface Validatable {
    value: string | number,
    required?: boolean,
    minLength?: number,
    maxLength?: number,
    min?: number,
    max?: number
}


function validate(validateInput: Validatable) {
    let isValid = true;
    if (validateInput.required) {
        isValid = isValid && validateInput.value.toString().trim().length !== 0
    }
    if (validateInput.minLength != null && typeof validateInput.value == "string") {
        isValid = isValid && validateInput.value.length > validateInput.minLength
    }
    if (validateInput.maxLength != null && typeof validateInput.value == "string") {
        isValid = isValid && validateInput.value.length <= validateInput.maxLength
    }
    if (validateInput.min != null && typeof validateInput.value === 'number') {
        isValid = isValid && validateInput.value > validateInput.min
    }
    if (validateInput.max != null && typeof validateInput.value === 'number') {
        isValid = isValid && validateInput.value <= validateInput.max
    }
    return isValid
}

abstract class ProjectComponent<T extends HTMLElement , U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;
    constructor(templateId : string, hostElementId : string, insertAtStart : boolean, newElementId? : string){
    this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T;
    const importedNode = document.importNode(this.templateElement.content, true)
    this.element = importedNode.firstElementChild as U
       if(newElementId){
        this.element.id = newElementId;
       }  
       this.attach(insertAtStart)

}
    private attach(insertAtStart : boolean) {
        this.hostElement.insertAdjacentElement(insertAtStart ? 'afterbegin' : 'afterend', this.element)
    }
    abstract configure(): void;
    abstract renderContent(): void;

}
class ProjectList extends ProjectComponent<HTMLDivElement, HTMLElement> {
    assignedProjects: Project[];
    constructor(private type: 'active' | 'finished') {
        super('project-list', 'app', false ,`${type}-projects`)
        // we cant use this with out using
       
        this.assignedProjects = [];
        projectState.addListener((projects: Project[]) => {
            const relevantProjects = projects.filter((prj)=>{
                if (type === 'active'){
                   return prj.status === ProjectStatus.Active
                }
                else {
                    return prj.status === ProjectStatus.Finished
                }
            })
            
            this.assignedProjects = relevantProjects
            this.renderProjects()
        })

        this.renderContent()

    }
    configure() {
        projectState.addListener((projects: Project[]) => {
          const relevantProjects = projects.filter(prj => {
            if (this.type === 'active') {
              return prj.status === ProjectStatus.Active;
            }
            return prj.status === ProjectStatus.Finished;
          });
          this.assignedProjects = relevantProjects;
          this.renderProjects();
        });
      }
    renderContent() {
        const listid = `${this.type}-projects-list`
        this.element.querySelector('ul')!.id = listid
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + "PROJECTS"

    }
    private renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        listEl.innerHTML ='';
        for (const prjItem of this.assignedProjects) {
            const listItem = document.createElement('li');
            listItem.textContent = prjItem.title;
            listEl.appendChild(listItem)
        }
    }
  



}

//ProjectInput Class
class ProjectInput  extends ProjectComponent<HTMLDivElement, HTMLFormElement> {
 
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement
    peopleInputElement: HTMLInputElement

    constructor() {
        super('project-input', 'app', true ,"user-input")
        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector("#people") as HTMLInputElement;
        this.configure();
    }

    
 configure() {
    this.element.addEventListener('submit', this.submitHandler)
}
renderContent() {}


    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value
        const enteredPeople = this.peopleInputElement.value

        const titleValidatable: Validatable = {
            value: enteredTitle,
            required: true
        }
        const descriptionValidatable: Validatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        }
        const peopleValidatable: Validatable = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 5
        }
        if (!validate(titleValidatable)
            || !validate(descriptionValidatable) ||
            !validate(peopleValidatable)
        ) {
            alert('Invalid Input, Please try again');
            return;
        }
        else {
            return [enteredTitle, enteredDescription, +enteredPeople]
        }

    }

    private clearInputs() {
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = ''
    }

    @autobind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput()
        // since tuple is an array
        if (Array.isArray(userInput)) {
            const [title, desc, people] = userInput
            projectState.addProjects(title, desc, people)
            this.clearInputs()
        }

    }


}

const ProjInput = new ProjectInput()


const activePrjList = new ProjectList("active")
const FinishedPrjList = new ProjectList("finished")




